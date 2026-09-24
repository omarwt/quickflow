#!/usr/bin/env bash
# BE-07 API regression: every phase script on its own fresh database, the 500 ms budget (NFR-1),
# and the Swagger document exported to backend/openapi.json for frontend-dev.
set -u
cd "$(dirname "$0")/../../.."
fail=0

echo "## regression"
for s in loops/backend-dev/verification/phase-0[1-6].sh; do
  backend/run.sh start --fresh >/dev/null || { echo "FAIL could not start backend"; exit 1; }
  if out=$(bash "$s" 2>&1); then echo "PASS $s: $(tail -1 <<<"$out")"; else echo "FAIL $s"; grep '  FAIL' <<<"$out"; fail=1; fi
done

echo "## latency (NFR-1: under 500 ms)"
backend/run.sh start --fresh >/dev/null
B=http://localhost:8080
for i in $(seq 50); do curl -s -o /dev/null -X POST $B/api/tasks -H 'Content-Type: application/json' -d "{\"title\":\"warm $i\"}"; done
time_ms() { curl -s -o /dev/null -w '%{time_total}' "$@" | awk '{printf "%d", $1 * 1000}'; }
check() {
  local label="$1"; shift; local ms; ms=$(time_ms "$@")
  if (( ms < 500 )); then echo "PASS $label ${ms}ms"; else echo "FAIL $label ${ms}ms"; fail=1; fi
}
J=(-H 'Content-Type: application/json')
check "create task"   -X POST $B/api/tasks "${J[@]}" -d '{"title":"timed"}'
check "update task"   -X PUT $B/api/tasks/1 "${J[@]}" -d '{"title":"timed 2"}'
check "filter tasks"  "$B/api/tasks?search=warm&status=TODO&sort=DUE_DATE"
check "complete task" -X POST $B/api/tasks/2/complete
check "delete task"   -X DELETE $B/api/tasks/3
check "create habit"  -X POST $B/api/habits "${J[@]}" -d '{"name":"h","frequency":"DAILY"}'
check "dashboard"     $B/api/dashboard

echo "## swagger"
curl -sf $B/v3/api-docs | jq . > backend/openapi.json || { echo "FAIL cannot fetch api-docs"; exit 1; }
for p in /api/settings /api/tasks /api/tasks/{id} /api/habits /api/habits/{id}/completions /api/learning-cards \
         /api/learning-cards/{id}/milestones /api/learning-cards/{id}/notes /api/plans /api/plans/{id}/items/{itemId} \
         /api/plans/start-notifications /api/plans/sources /api/dashboard; do
  jq -e --arg p "$p" '.paths[$p]' backend/openapi.json >/dev/null && echo "PASS documented $p" || { echo "FAIL missing $p"; fail=1; }
done
missing=$(jq -r '[.paths | to_entries[] | .key as $p | .value | to_entries[] | select((.value.responses // {}) | length == 0) | "\(.key) \($p)"] | join(", ")' backend/openapi.json)
[[ -z "$missing" ]] && echo "PASS every operation declares responses" || { echo "FAIL no responses: $missing"; fail=1; }
echo "operations: $(jq '[.paths[] | keys[]] | length' backend/openapi.json), schemas: $(jq '.components.schemas | length' backend/openapi.json)"

(( fail == 0 )) && echo "regression: PASS" || echo "regression: FAIL"
exit $fail
