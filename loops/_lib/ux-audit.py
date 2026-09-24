#!/usr/bin/env python3
"""ux-audit.py - Lighthouse gate through the Chrome DevTools MCP server (headless, isolated profile).

Talks to chrome-devtools-mcp over stdio directly (no LLM in the loop), so the scores are exactly what
Lighthouse reported. For every page x device it navigates, runs `lighthouse_audit`, keeps the report in
the output dir and compares the category scores and CLS with the thresholds. Exit 0 only if all pass.

usage: ux-audit.py [--url http://localhost:5173] [--pages /dashboard,/tasks] [--devices mobile,desktop]
                   [--min accessibility=95 ...] [--max-cls 0.1] --out <evidence dir>
"""
import argparse, json, os, subprocess, sys

ap = argparse.ArgumentParser()
ap.add_argument("--url", default="http://localhost:5173")
ap.add_argument("--pages", default="/dashboard,/tasks,/habits,/learning,/plans,/settings")
ap.add_argument("--devices", default="mobile,desktop")
ap.add_argument("--min", action="append", default=[], help="category=score (0-100), repeatable")
ap.add_argument("--max-cls", type=float, default=0.1)
ap.add_argument("--out", required=True)
a = ap.parse_args()
mins = dict(m.split("=") for m in a.min) or {"accessibility": "95", "best-practices": "95", "seo": "90"}
os.makedirs(a.out, exist_ok=True)

srv = subprocess.Popen(["npx", "-y", "chrome-devtools-mcp@latest", "--headless", "--isolated"],
                       stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)
seq = 0


def call(method, params=None, notify=False):
    global seq
    msg = {"jsonrpc": "2.0", "method": method, "params": params or {}}
    if not notify:
        seq += 1
        msg["id"] = seq
    srv.stdin.write(json.dumps(msg) + "\n")
    srv.stdin.flush()
    if notify:
        return None
    for line in srv.stdout:
        try:
            m = json.loads(line)
        except ValueError:
            continue
        if m.get("method") == "roots/list":  # the server writes reports only inside client roots
            srv.stdin.write(json.dumps({"jsonrpc": "2.0", "id": m["id"], "result": {"roots": [
                {"uri": "file://" + os.path.abspath(a.out), "name": "evidence"}]}}) + "\n")
            srv.stdin.flush()
            continue
        if m.get("id") == seq and "method" not in m:
            if "error" in m:
                raise RuntimeError(m["error"])
            text = "".join(c.get("text", "") for c in m["result"].get("content", []))
            if m["result"].get("isError"):
                raise RuntimeError(text)
            return text
    raise RuntimeError("MCP server exited")


def tool(name, **args):
    return call("tools/call", {"name": name, "arguments": args})


rows, ok = [], True
try:
    call("initialize", {"protocolVersion": "2025-06-18", "capabilities": {"roots": {}}, "clientInfo": {"name": "ux-audit", "version": "1"}})
    call("notifications/initialized", notify=True)
    for page in a.pages.split(","):
        tool("navigate_page", pageId=1, url=a.url.rstrip("/") + page)
        for dev in a.devices.split(","):
            d = os.path.join(os.path.abspath(a.out), f"{page.strip('/') or 'root'}-{dev}")
            tool("lighthouse_audit", pageId=1, device=dev, outputDirPath=d)
            rep = json.load(open(os.path.join(d, "report.json")))
            scores = {k: round(v["score"] * 100) for k, v in rep["categories"].items() if v.get("score") is not None}
            cls = rep["audits"].get("cumulative-layout-shift", {}).get("numericValue", 0)
            fails = [f"{c} {scores.get(c)} < {m}" for c, m in mins.items() if scores.get(c, 0) < int(m)]
            if cls > a.max_cls:
                fails.append(f"CLS {cls:.3f} > {a.max_cls}")
            failed_audits = [k for k, x in rep["audits"].items()
                             if x.get("scoreDisplayMode") in ("binary", "numeric") and x.get("score") is not None and x["score"] < 1]
            ok &= not fails
            rows.append({"page": page, "device": dev, "scores": scores, "cls": round(cls, 3), "fails": fails, "failedAudits": failed_audits})
            print(f"  [{'FAIL' if fails else 'PASS'}] {page} {dev} :: "
                  + " ".join(f"{c}={scores.get(c)}" for c in mins) + f" cls={cls:.3f}"
                  + (f" :: {'; '.join(fails)}" if fails else "") + (f" (failed audits: {', '.join(failed_audits)})" if failed_audits else ""))
except Exception as e:  # server missing, page unreachable, audit error
    print(f"FAIL: {e}")
    ok = False
finally:
    srv.kill()

json.dump(rows, open(os.path.join(a.out, "summary.json"), "w"), indent=1)
print(f"ux-audit: {'PASS' if ok and rows else 'FAIL'} ({len(rows)} audits, thresholds "
      + ", ".join(f"{c}>={m}" for c, m in mins.items()) + f", cls<={a.max_cls}; reports in {a.out})")
sys.exit(0 if ok and rows else 1)
