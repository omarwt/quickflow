#!/usr/bin/env python3
"""loop.py - state keeper for the Claude Loops (stdlib only).

The agent does the thinking and the coding; this script owns the bookkeeping so it
stays honest: phase order, the 3-trial stop condition, verification results, timings,
token usage and execution-tracking.csv. task.md and progress.md are rendered from
state/ on every change.

  loop.py init    <loop> --input <PRD.md|story> [--mode prd|story]
  loop.py plan    <loop> <plan.json>
  loop.py next    <loop>
  loop.py start   <loop> <phase>
  loop.py task    <loop> <phase> <T1 T2 ...|all> [--status todo|in_progress|done|blocked]
  loop.py verify  <loop> <phase> [--check "name=shell cmd"]... [--manual "name=pass|fail"]... [--evidence path]...
  loop.py note    <loop> <phase> [--error "..."] [--fix "..."]
  loop.py finish  <loop> <phase> [--blocked "reason"]
  loop.py status  <loop>
  loop.py track   --prompt "..." [--loop L --phase P --status S --notes N]
  loop.py hook    (Claude Code hook: reads the hook JSON on stdin)
"""
import argparse, csv, datetime as dt, glob, json, os, re, subprocess, sys

LOOPS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT = os.path.dirname(LOOPS)
CSV = os.path.join(ROOT, "execution-tracking.csv")
ACTIVE = os.path.join(LOOPS, ".active.json")
MAX_TRIALS = 3
FIELDS = ["timestamp", "session_id", "loop", "phase", "requirement", "prompt", "status", "retry", "verification", "notes"]
MARK = {"todo": " ", "in_progress": "-", "done": "x", "blocked": "!"}


def die(msg):
    sys.exit(f"loop.py: {msg}")


def now():
    return dt.datetime.now().astimezone().replace(microsecond=0)


def session_id():
    # Only what Claude Code actually exposes - never invented.
    return os.environ.get("CLAUDE_CODE_SESSION_ID") or "unavailable"


def read(path, default=None):
    return json.load(open(path)) if os.path.exists(path) else default


def write(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path + ".tmp", "w") as f:
        json.dump(data, f, indent=2)
    os.replace(path + ".tmp", path)


def track(**row):
    new = not os.path.exists(CSV)
    active = read(ACTIVE, {})
    row = {"timestamp": now().isoformat(), "session_id": session_id(), "loop": active.get("loop", "-"),
           "phase": active.get("phase", "-"), **{k: v for k, v in row.items() if v not in (None, "")}}
    with open(CSV, "a", newline="") as f:
        w = csv.DictWriter(f, FIELDS, extrasaction="ignore")
        if new:
            w.writeheader()
        w.writerow(row)


def tokens(start, end):
    """Real usage from this session's transcript between two times (None if unavailable)."""
    sid = session_id()
    files = glob.glob(os.path.expanduser(f"~/.claude/projects/*/{sid}.jsonl"))
    files += glob.glob(os.path.expanduser(f"~/.claude/projects/*/{sid}/**/*.jsonl"), recursive=True)
    if sid == "unavailable" or not files:
        return None
    total, seen = {"input": 0, "output": 0, "cache_write": 0, "cache_read": 0}, set()
    for path in files:
        for line in open(path, errors="ignore"):
            if '"usage"' not in line:
                continue
            d = json.loads(line)
            msg, ts = d.get("message") or {}, d.get("timestamp")
            u = msg.get("usage")
            if not u or not ts or msg.get("id") in seen:
                continue
            if start <= dt.datetime.fromisoformat(ts.replace("Z", "+00:00")) <= end:
                seen.add(msg.get("id"))
                total["input"] += u.get("input_tokens", 0)
                total["output"] += u.get("output_tokens", 0)
                total["cache_write"] += u.get("cache_creation_input_tokens", 0)
                total["cache_read"] += u.get("cache_read_input_tokens", 0)
    total["total"] = sum(total.values())
    return total


class Loop:
    def __init__(self, name):
        self.name, self.dir = name, os.path.join(LOOPS, name)
        if not os.path.isdir(self.dir):
            die(f"no such loop: {name}")
        self.state_file = os.path.join(self.dir, "state", "loop-state.json")
        self.st = read(self.state_file)

    def require(self):
        if not self.st:
            die(f"{self.name} not initialised: loop.py init {self.name} --input <file>")
        return self.st

    def phase(self, pid):
        for p in self.require()["phases"]:
            if p["id"] == pid:
                return p
        die(f"unknown phase {pid}")

    def deps_missing(self, p):
        missing = []
        for d in p.get("dependsOn", []):
            if d.startswith("ext:"):  # cross-loop: ext:backend-dev/BE-02
                other, _, pid = d[4:].partition("/")
                o = read(os.path.join(LOOPS, other, "state", "loop-state.json"), {"phases": []})
                if not any(x["id"] == pid and x["status"] == "done" for x in o["phases"]):
                    missing.append(d)
            elif self.phase(d)["status"] != "done":
                missing.append(d)
        return missing

    def output(self, p):
        slug = re.sub(r"[^a-z0-9]+", "-", p["title"].lower()).strip("-")
        num = int(re.sub(r"\D", "", p["id"]) or 0)
        return os.path.join(self.dir, "outputs", f"phase-{num:02d}-{slug}.md")

    def save(self):
        st, ph = self.st, self.st["phases"]
        cur = next((p for p in ph if p["status"] == "in_progress"), None)
        st.update(lastUpdated=now().isoformat(), currentPhase=cur and cur["id"],
                  completedPhases=[p["id"] for p in ph if p["status"] == "done"],
                  blockedPhases=[p["id"] for p in ph if p["status"].startswith("blocked")],
                  retryCount=cur["failedTrials"] if cur else 0,
                  verificationStatus=cur["verification"] if cur else "-")
        done, blocked = len(st["completedPhases"]), len(st["blockedPhases"])
        st["status"] = ("not_planned" if not ph else "completed" if done == len(ph) else "in_progress" if cur
                        else "blocked" if done + blocked == len(ph) else "ready")
        write(self.state_file, st)
        self.render()

    def render(self):
        st = self.st
        t = [f"# Tasks — {self.name}", "", f"Input: `{st['input']}` · Mode: {st['mode']} · Status: **{st['status']}**",
             "", "`[ ]` not started · `[-]` in progress · `[x]` completed · `[!]` blocked", ""]
        for p in st["phases"]:
            t += [f"## {p['id']} {p['title']} ({p['status']})", ""]
            t += [f"- [{MARK[x['status']]}] {x['id']} {x['title']}" for x in p["tasks"]] + [""]
        open(os.path.join(self.dir, "task.md"), "w").write("\n".join(t))

        g = [f"# Progress — {self.name}", "", f"Status: **{st['status']}** · Input: `{st['input']}` ({st['mode']})",
             f"Current phase: {st['currentPhase'] or '-'} · Completed: {', '.join(st['completedPhases']) or '-'}"
             f" · Blocked: {', '.join(st['blockedPhases']) or '-'}",
             f"Remaining: {', '.join(p['id'] for p in st['phases'] if p['status'] != 'done') or '-'}", ""]
        for p in st["phases"]:
            if not p.get("start"):
                continue
            tok = p.get("tokens")
            g += [f"## {p['id']} {p['title']}", "", f"Status: {p['status']}", "", f"Start: {p['start']}", "",
                  f"End: {p.get('end') or '-'}", "", f"Duration: {p.get('duration') or '-'}", "",
                  "Token consumption: " + (f"{tok['total']:,} (input {tok['input']:,}, output {tok['output']:,}, "
                                           f"cache write {tok['cache_write']:,}, cache read {tok['cache_read']:,})"
                                           if tok else "unavailable"), "",
                  f"Retries: {p['failedTrials']}/{MAX_TRIALS}", "", f"Verification: {p['verification'].upper()}", "",
                  "Tests:"]
            for i, run in enumerate(p["runs"], 1):
                g.append(f"- trial {i} ({run['at']}): {run['result'].upper()}")
                g += [f"  - {c['name']}: {c['result']}" + (f" — `{c['cmd']}`" if c.get("cmd") else "")
                      + (f" — {c['log']}" if c.get("log") else "") for c in run["checks"]]
                g += [f"  - evidence: {e}" for e in run.get("evidence", [])]
            for key, label in (("errors", "Errors"), ("fixes", "Fixes")):
                if p.get(key):
                    g += ["", f"{label}:"] + [f"- {e}" for e in p[key]]
            g += ["", f"Output: `{os.path.relpath(self.output(p), self.dir)}`", ""]
        open(os.path.join(self.dir, "progress.md"), "w").write("\n".join(g))


def cmd_init(a):
    lp = Loop(a.loop)
    if lp.st:
        print(f"{a.loop} already initialised (status {lp.st['status']}) - resuming")
        return
    lp.st = {"loop": a.loop, "input": a.input, "mode": a.mode, "created": now().isoformat(), "phases": []}
    lp.save()
    track(loop=a.loop, phase="-", requirement=a.input, prompt=f"init {a.loop} ({a.mode})", status="Started")
    print(f"initialised {a.loop}")


def cmd_plan(a):
    lp = Loop(a.loop)
    old = {p["id"]: p for p in lp.require()["phases"]}
    phases = []
    for p in json.load(open(a.file))["phases"]:
        prev = old.get(p["id"])
        if prev and prev["status"] != "pending":  # never reset work already started or done
            phases.append(prev)
            continue
        tasks = [{"id": f"T{i}", "title": t, "status": "todo"} for i, t in enumerate(p["tasks"], 1)]
        phases.append({**p, "tasks": tasks, "status": "pending", "failedTrials": 0, "verification": "pending",
                       "runs": [], "errors": [], "fixes": []})
    lp.st["phases"] = phases
    lp.save()
    print(f"{a.loop}: {len(phases)} phases planned")


def cmd_next(a):
    lp = Loop(a.loop)
    ph = lp.require()["phases"]
    cur = next((p for p in ph if p["status"] == "in_progress"), None)
    if cur:
        print(json.dumps({"action": "resume", "phase": cur["id"], "failedTrials": cur["failedTrials"]}))
        return
    ready = next((p for p in ph if p["status"] == "pending" and not lp.deps_missing(p)), None)
    print(json.dumps({"action": "start", "phase": ready["id"]} if ready else
                     {"action": "none", "pending": [p["id"] for p in ph if p["status"] == "pending"]}))


def cmd_start(a):
    lp = Loop(a.loop)
    p = lp.phase(a.phase)
    if p["status"] == "done":
        print(f"{a.phase} already done - skipped")
        return
    if p["status"].startswith("blocked"):
        die(f"{a.phase} is {p['status']}")
    if lp.deps_missing(p):
        die(f"{a.phase} waits for {', '.join(lp.deps_missing(p))}")
    other = next((x for x in lp.st["phases"] if x["status"] == "in_progress" and x["id"] != a.phase), None)
    if other:
        die(f"{other['id']} is still in progress")
    p["status"] = "in_progress"
    p.setdefault("start", now().isoformat())
    out = lp.output(p)
    if not os.path.exists(out):
        os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, "w").write("\n".join(
            [f"# {p['id']} {p['title']}", "", "## Requirements covered", ""] +
            [f"- {r}" for r in p.get("requirements", [])] +
            ["", "## Tasks", ""] + [f"- {t['id']} {t['title']}" for t in p["tasks"]] +
            ["", "## Implementation", "", "_TODO_", "", "## Files changed", "", "_TODO_", "",
             "## APIs / components", "", "_TODO_", "", "## Tests and verification", "", "_TODO_", "",
             "## Problems found and fixes", "", "_TODO_", "", "## Final status", "", "_TODO_", ""]))
    lp.save()
    write(ACTIVE, {"loop": a.loop, "phase": a.phase})
    track(loop=a.loop, phase=a.phase, requirement=", ".join(p.get("requirements", [])),
          prompt=f"start {a.loop} {a.phase} {p['title']}", status="Started", retry=p["failedTrials"])
    print(f"started {a.phase}; document it in {os.path.relpath(out, ROOT)}")


def cmd_task(a):
    lp = Loop(a.loop)
    p = lp.phase(a.phase)
    ids = [t["id"] for t in p["tasks"]] if a.ids == ["all"] else a.ids
    for t in p["tasks"]:
        if t["id"] in ids:
            t["status"] = a.status
    lp.save()
    print(f"{a.phase}: {' '.join(ids)} -> {a.status}")


def cmd_verify(a):
    lp = Loop(a.loop)
    p = lp.phase(a.phase)
    if p["status"] != "in_progress":
        die(f"{a.phase} is {p['status']}; start it first")
    trial = len(p["runs"]) + 1
    logdir = os.path.join(lp.dir, "outputs", "evidence")
    os.makedirs(logdir, exist_ok=True)
    checks = []
    for spec in a.check:
        name, _, cmd = spec.partition("=")
        log = os.path.join(logdir, f"{a.phase}-trial{trial}-{name}.log")
        with open(log, "w") as f:
            code = subprocess.run(cmd, shell=True, cwd=ROOT, stdout=f, stderr=subprocess.STDOUT,
                                  executable="/bin/bash").returncode
        checks.append({"name": name, "cmd": cmd, "result": "pass" if code == 0 else "fail",
                       "log": os.path.relpath(log, lp.dir)})
    for spec in a.manual:  # e.g. Playwright MCP results observed by the agent
        name, _, res = spec.partition("=")
        if res not in ("pass", "fail"):
            die("--manual must be name=pass|fail")
        checks.append({"name": name, "result": res})
    if not checks:
        die("nothing to verify: give --check and/or --manual")
    ok = all(c["result"] == "pass" for c in checks)
    p["runs"].append({"at": now().isoformat(), "result": "pass" if ok else "fail", "checks": checks,
                      "evidence": a.evidence})
    p["verification"] = "pass" if ok else "fail"
    if not ok:
        p["failedTrials"] += 1
        p["errors"].append(f"trial {trial} failed: {', '.join(c['name'] for c in checks if c['result'] == 'fail')}")
        if p["failedTrials"] >= MAX_TRIALS:
            block(lp, p, f"{MAX_TRIALS} failed trials")
            write(ACTIVE, {"loop": a.loop, "phase": "-"})
    lp.save()
    track(loop=a.loop, phase=a.phase, prompt=f"verify {a.phase}: " + "; ".join(a.check + a.manual),
          status="Completed" if ok else "Failed", retry=p["failedTrials"], verification="PASS" if ok else "FAIL")
    for c in checks:
        print(f"  {c['result'].upper():4} {c['name']}" + (f"  ({c['log']})" if c.get("log") else ""))
    print(f"{a.phase} trial {trial}: {'PASS' if ok else 'FAIL'}"
          + (f" - BLOCKED" if p["status"] == "blocked" else f" ({p['failedTrials']}/{MAX_TRIALS} failed)"))
    sys.exit(0 if ok else 2)


def block(lp, p, reason):
    p.update(status="blocked", end=now().isoformat(), blockedReason=reason)
    p["errors"].append(f"blocked: {reason}")
    changed = True
    while changed:  # dependants cannot run either
        changed = False
        for x in lp.st["phases"]:
            if x["status"] == "pending" and any(lp.phase(d)["status"].startswith("blocked")
                                                for d in x.get("dependsOn", []) if not d.startswith("ext:")):
                x["status"], changed = "blocked_by_dependency", True


def cmd_note(a):
    lp = Loop(a.loop)
    p = lp.phase(a.phase)
    if a.error:
        p["errors"].append(a.error)
    if a.fix:
        p["fixes"].append(a.fix)
    lp.save()


def cmd_finish(a):
    lp = Loop(a.loop)
    p = lp.phase(a.phase)
    if p["status"] != "in_progress":
        die(f"{a.phase} is {p['status']}")
    if a.blocked:
        block(lp, p, a.blocked)
    else:
        if p["verification"] != "pass":
            die("last verification did not pass - run loop.py verify")
        open_tasks = [t["id"] for t in p["tasks"] if t["status"] != "done"]
        if open_tasks:
            die(f"open tasks: {', '.join(open_tasks)}")
        if "_TODO_" in open(lp.output(p)).read():
            die(f"fill in {os.path.relpath(lp.output(p), ROOT)} first")
        p.update(status="done", end=now().isoformat())
    start, end = dt.datetime.fromisoformat(p["start"]), dt.datetime.fromisoformat(p["end"])
    secs = int((end - start).total_seconds())
    p["duration"] = f"{secs // 60}m {secs % 60:02d}s"
    p["tokens"] = tokens(start, end)
    lp.save()
    write(ACTIVE, {"loop": a.loop, "phase": "-"})
    track(loop=a.loop, phase=a.phase, prompt=f"finish {a.phase}", status="Completed" if not a.blocked else "Failed",
          retry=p["failedTrials"], verification=p["verification"].upper(),
          notes=f"{p['duration']}, tokens {(p['tokens'] or {}).get('total', 'unavailable')}")
    print(f"{a.phase} -> {p['status']} ({p['duration']})")


def cmd_status(a):
    st = Loop(a.loop).require()
    print(f"{a.loop}: {st['status']}")
    for p in st["phases"]:
        n = sum(t["status"] == "done" for t in p["tasks"])
        print(f"  {p['id']:8} {p['status']:22} tasks {n}/{len(p['tasks'])} trials failed {p['failedTrials']}  {p['title']}")


def cmd_track(a):
    track(session_id=a.session, loop=a.loop, phase=a.phase, requirement=a.requirement, prompt=a.prompt,
          status=a.status, notes=a.notes)


def cmd_hook(a):
    try:
        d = json.load(sys.stdin)
    except ValueError:
        return
    if d.get("hook_event_name") == "UserPromptSubmit":
        prompt = re.sub(r"<(ide_\w+|system-reminder)>.*?</\1>\s*", "", d.get("prompt") or "", flags=re.S)
        track(session_id=d.get("session_id") or "unavailable", prompt=prompt.strip()[:4000],
              status="Started", notes="UserPromptSubmit hook")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("init"); s.add_argument("loop"); s.add_argument("--input", required=True)
    s.add_argument("--mode", choices=["prd", "story"], default="prd"); s.set_defaults(fn=cmd_init)
    s = sub.add_parser("plan"); s.add_argument("loop"); s.add_argument("file"); s.set_defaults(fn=cmd_plan)
    for name, fn in (("next", cmd_next), ("status", cmd_status)):
        s = sub.add_parser(name); s.add_argument("loop"); s.set_defaults(fn=fn)
    s = sub.add_parser("start"); s.add_argument("loop"); s.add_argument("phase"); s.set_defaults(fn=cmd_start)
    s = sub.add_parser("task"); s.add_argument("loop"); s.add_argument("phase"); s.add_argument("ids", nargs="+")
    s.add_argument("--status", choices=list(MARK), default="done"); s.set_defaults(fn=cmd_task)
    s = sub.add_parser("verify"); s.add_argument("loop"); s.add_argument("phase")
    s.add_argument("--check", action="append", default=[]); s.add_argument("--manual", action="append", default=[])
    s.add_argument("--evidence", action="append", default=[]); s.set_defaults(fn=cmd_verify)
    s = sub.add_parser("note"); s.add_argument("loop"); s.add_argument("phase")
    s.add_argument("--error"); s.add_argument("--fix"); s.set_defaults(fn=cmd_note)
    s = sub.add_parser("finish"); s.add_argument("loop"); s.add_argument("phase"); s.add_argument("--blocked")
    s.set_defaults(fn=cmd_finish)
    s = sub.add_parser("track")
    for o in ("loop", "phase", "requirement", "notes", "session"):
        s.add_argument(f"--{o}")
    s.add_argument("--prompt", required=True); s.add_argument("--status", default="Completed"); s.set_defaults(fn=cmd_track)
    s = sub.add_parser("hook"); s.set_defaults(fn=cmd_hook)
    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
