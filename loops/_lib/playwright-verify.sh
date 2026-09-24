#!/usr/bin/env bash
# playwright-verify.sh <scenario.md> [url] - run a browser scenario through the Playwright MCP server, headless.
#
# Starts a child Claude Code session whose only tools are the Playwright MCP tools (headless, isolated
# profile, so it never touches your own browser). The child must end with a line
#   VERDICT: {"verdict":"PASS"|"FAIL","checks":[{"step":"...","result":"PASS|FAIL","observed":"..."}]}
# Exit code 0 only on PASS. Screenshots go to <loop>/outputs/evidence/; the child's session id is
# recorded in execution-tracking.csv.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SCENARIO="${1:?scenario file required}"; URL="${2:-http://localhost:5173}"
NAME="$(basename "$SCENARIO" .md)"
OUT_DIR="$ROOT/loops/frontend-dev/outputs/evidence/$NAME"
mkdir -p "$OUT_DIR"
curl -sf -o /dev/null "$URL" || { echo "FAIL: app not reachable at $URL"; exit 1; }

# Pinned and warmed up first: resolving @latest on every start sometimes took longer than Claude Code's
# 30 s MCP connect timeout, leaving the session without browser tools. Override with PLAYWRIGHT_MCP_VERSION.
PKG="@playwright/mcp@${PLAYWRIGHT_MCP_VERSION:-0.0.82}"
timeout 180 npx -y --prefer-offline "$PKG" --help >/dev/null 2>&1 || true
CFG="$(mktemp --suffix=.json)"; RES="$(mktemp)"
trap 'rm -f "$CFG" "$RES"' EXIT
cat > "$CFG" <<JSON
{"mcpServers":{"playwright":{"type":"stdio","command":"npx","args":["-y","--prefer-offline","$PKG","--headless","--isolated","--output-dir","$OUT_DIR"]}}}
JSON

PROMPT="You are the browser-verification step of a Claude Loop. Use only the Playwright MCP tools.
Application URL: $URL
Perform every step below as a user would (navigate, click, type, submit). After each step check the
page snapshot for the expected result; never assume a result you did not observe. Take a screenshot
(browser_take_screenshot, a short file name) at steps marked [screenshot] and whenever a check fails.
Continue after a failed step when possible.
End your reply with exactly one line and nothing after it:
VERDICT: {\"verdict\":\"PASS\" or \"FAIL\",\"checks\":[{\"step\":\"...\",\"result\":\"PASS|FAIL\",\"observed\":\"...\"}]}
The verdict is PASS only if every check passed.

--- SCENARIO ---
$(cat "$SCENARIO")"

# One retry, only when the browser server itself never came up (the scenario wasn't run at all);
# a failed scenario step is never retried here.
for attempt in 1 2; do
(cd "$OUT_DIR" && claude -p "$PROMPT" --model "${PLAYWRIGHT_VERIFY_MODEL:-sonnet}" --mcp-config "$CFG" --strict-mcp-config \
  --allowedTools "mcp__playwright__*" --output-format json < /dev/null > "$RES") || true

set +e
python3 - "$RES" "$NAME" "$ROOT" "$attempt" <<'PY'
import json, re, subprocess, sys
res, name, root, attempt = sys.argv[1:5]
try:
    d = json.load(open(res))
except ValueError:
    print("FAIL: no output from the verification session"); sys.exit(1)
text = (d.get("result") or "").strip()
m = re.search(r"VERDICT:\s*(\{.*\})\s*$", text, re.S)
v = json.loads(m.group(1)) if m else {"verdict": "FAIL", "checks": []}
u = d.get("usage") or {}
tokens = sum(u.get(k, 0) for k in ("input_tokens", "output_tokens", "cache_creation_input_tokens", "cache_read_input_tokens"))
for c in v.get("checks", []):
    print(f"  [{c.get('result')}] {c.get('step')} :: {c.get('observed', '')}")
ok = v.get("verdict") == "PASS" and v.get("checks") and all(c.get("result") == "PASS" for c in v["checks"])
sid = d.get("session_id", "unavailable")
infra = not any(c.get("result") == "PASS" for c in v.get("checks", [])) and re.search(
    r"failed to connect|CONNECT_TIMEOUT|no (browser|playwright) tools", text, re.I)
if infra and attempt == "1":
    print(f"playwright {name}: browser server did not start (session {sid}); retrying once")
    subprocess.run([sys.executable, f"{root}/loops/_lib/loop.py", "track", "--session", sid, "--prompt", f"playwright-verify {name}",
                    "--status", "Failed", "--notes", "infrastructure: Playwright MCP server did not connect; scenario not run; retried"])
    sys.exit(3)
print(f"playwright {name}: {'PASS' if ok else 'FAIL'} ({len(v.get('checks', []))} checks, session {sid}, {tokens} tokens)")
if not m:
    print("no VERDICT line; last output:\n" + text[-1500:])
subprocess.run([sys.executable, f"{root}/loops/_lib/loop.py", "track", "--session", sid, "--prompt", f"playwright-verify {name}",
                "--status", "Completed" if ok else "Failed", "--notes", f"headless Playwright MCP child session, {tokens} tokens"])
sys.exit(0 if ok else 1)
PY
code=$?; set -e
[[ $code -eq 3 ]] && continue
exit $code
done
