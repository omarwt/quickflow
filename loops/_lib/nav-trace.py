#!/usr/bin/env python3
"""nav-trace.py - performance trace of page-to-page navigation through the Chrome DevTools MCP server.

Headless, isolated profile, no LLM: opens the first page, starts a trace, clicks the navigation links in
order (real clicks via the DevTools `click` tool), stops the trace and reads INP and CLS from the trace
summary. Exit 0 only if INP <= --max-inp ms and CLS <= --max-cls.

usage: nav-trace.py [--url http://localhost:5173] [--start /tasks] [--links "Habits,Learning Resources,..."]
                    [--max-inp 200] [--max-cls 0.1] [--viewport 1280x800] --out <evidence dir>
"""
import argparse, json, os, re, subprocess, sys

ap = argparse.ArgumentParser()
ap.add_argument("--url", default="http://localhost:5173")
ap.add_argument("--start", default="/tasks")
ap.add_argument("--links", default="Habits,Learning Resources,Todo Plans,Settings,Tasks")
ap.add_argument("--max-inp", type=float, default=200)
ap.add_argument("--max-cls", type=float, default=0.1)
ap.add_argument("--viewport", default="1280x800")
ap.add_argument("--out", required=True)
a = ap.parse_args()
out = os.path.abspath(a.out)
os.makedirs(out, exist_ok=True)
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
        if m.get("method") == "roots/list":
            srv.stdin.write(json.dumps({"jsonrpc": "2.0", "id": m["id"], "result": {"roots": [{"uri": "file://" + out, "name": "evidence"}]}}) + "\n")
            srv.stdin.flush()
            continue
        if m.get("id") == seq and "method" not in m:
            text = "".join(c.get("text", "") for c in m.get("result", {}).get("content", []))
            if "error" in m or m.get("result", {}).get("isError"):
                raise RuntimeError(text or m.get("error"))
            return text
    raise RuntimeError("MCP server exited")


def tool(name, **args):
    return call("tools/call", {"name": name, "arguments": args})


ok, report = False, ""
try:
    call("initialize", {"protocolVersion": "2025-06-18", "capabilities": {"roots": {}}, "clientInfo": {"name": "nav-trace", "version": "1"}})
    call("notifications/initialized", notify=True)
    w, h = a.viewport.split("x")
    tool("resize_page", pageId=1, width=int(w), height=int(h))
    tool("navigate_page", pageId=1, url=a.url.rstrip("/") + a.start)
    tool("performance_start_trace", pageId=1, reload=False, autoStop=False, filePath=os.path.join(out, "nav-trace.json.gz"))
    for link in a.links.split(","):
        snap = tool("take_snapshot", pageId=1)
        m = re.search(r'uid=(\S+) link "' + re.escape(link) + '"', snap)
        if not m:
            raise RuntimeError(f'link "{link}" not found in snapshot')
        tool("click", pageId=1, uid=m.group(1))
        tool("wait_for", pageId=1, text=[link])
    report = tool("performance_stop_trace", pageId=1)
    open(os.path.join(out, "nav-trace.txt"), "w").write(report)
    # the trace has one metrics block per (soft) navigation; the gate uses the worst of them
    inps = [float(x) for x in re.findall(r"- INP: ([\d.]+) ms", report)]
    clss = [float(x) for x in re.findall(r"- CLS: ([\d.]+)", report)]
    inp_v = max(inps) if inps else None
    cls_v = max(clss) if clss else 0.0
    ok = inp_v is not None and inp_v <= a.max_inp and cls_v <= a.max_cls
    print(f"nav-trace: {'PASS' if ok else 'FAIL'} ({len(a.links.split(','))} navigations from {a.start} at {a.viewport}; "
          f"worst INP={inp_v if inp_v is not None else 'not reported'} ms over {len(inps)} interactions (max {a.max_inp}), worst CLS={cls_v} (max {a.max_cls}); trace in {out})")
except Exception as e:
    print(f"nav-trace: FAIL: {e}")
finally:
    srv.kill()
sys.exit(0 if ok else 1)
