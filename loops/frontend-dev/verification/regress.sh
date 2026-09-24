#!/usr/bin/env bash
# regress.sh NN... - re-run earlier Playwright scenarios, each on a fresh database (and its seed script if it
# has one), in the isolated test environment (test-env.sh: UI :5180 -> backend :8090), so the copy you are
# using on :5173/:8080 is never reset or disturbed. Exit 0 only if every scenario passed.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; V="$ROOT/loops/frontend-dev/verification"
export API=http://localhost:8090
bash "$V/test-env.sh" start >/dev/null || { echo "FAIL: test environment did not start"; exit 1; }
failed=()
for n in "$@"; do
  bash "$V/test-env.sh" fresh >/dev/null || { echo "FAIL: test backend did not start"; exit 1; }
  [[ -f "$V/phase-$n-seed.sh" ]] && bash "$V/phase-$n-seed.sh"
  echo "== phase-$n"
  bash "$ROOT/loops/_lib/playwright-verify.sh" "$V/phase-$n.md" http://localhost:5180 || failed+=("phase-$n")
done
echo "regression: ${#failed[@]} of $# failed${failed:+ (${failed[*]})}"
[[ ${#failed[@]} -eq 0 ]]
