#!/usr/bin/env bash
# test-env.sh start|fresh|stop - an isolated copy of the app for browser verification, so checks never touch
# (or get disturbed by) the copy you use: backend on :8090 with an in-memory database, UI on :5180 -> :8090.
#   start  UI (if not running) + a fresh backend      fresh  restart only the backend, empty again
#   stop   both
# Scripts reach it with API=http://localhost:8090 (seeds) and the URL http://localhost:5180 (Playwright, audits).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
API_PORT=8090; UI_PORT=5180; UI_PID="$ROOT/frontend/node_modules/.tmp/test-ui.pid"
ui_up() { curl -sf -o /dev/null "http://localhost:$UI_PORT"; }
case "${1:-}" in
  fresh) PORT=$API_PORT CORS_ORIGINS="http://localhost:$UI_PORT" "$ROOT/backend/run.sh" start --fresh ;;
  start)
    PORT=$API_PORT CORS_ORIGINS="http://localhost:$UI_PORT" "$ROOT/backend/run.sh" start --fresh
    if ! ui_up; then
      mkdir -p "$(dirname "$UI_PID")"
      (cd "$ROOT/frontend" && UI_PORT=$UI_PORT API_URL="http://localhost:$API_PORT" nohup npx vite > node_modules/.tmp/test-ui.log 2>&1 & echo $! > "$UI_PID")
      for _ in $(seq 60); do ui_up && break; sleep 1; done
    fi
    ui_up && echo "test UI up on http://localhost:$UI_PORT" || { echo "test UI failed to start"; exit 1; } ;;
  stop)
    PORT=$API_PORT "$ROOT/backend/run.sh" stop || true
    [[ -f "$UI_PID" ]] && pkill -P "$(cat "$UI_PID")" 2>/dev/null; [[ -f "$UI_PID" ]] && kill "$(cat "$UI_PID")" 2>/dev/null; rm -f "$UI_PID"
    for p in $(lsof -ti tcp:$UI_PORT 2>/dev/null); do kill "$p"; done; echo "test env stopped" ;;
  *) sed -n '2,6p' "$0"; exit 64 ;;
esac
