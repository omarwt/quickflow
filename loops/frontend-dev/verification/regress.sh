#!/usr/bin/env bash
# regress.sh NN... - re-run earlier Playwright scenarios unchanged, each on a fresh backend database
# (and its seed script if it has one). Used by UI/UX phases to prove a restyle changed no behaviour.
# Restarts the backend on its normal database at the end. Exit 0 only if every scenario passed.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; V="$ROOT/loops/frontend-dev/verification"
failed=()
for n in "$@"; do
  "$ROOT/backend/run.sh" start --fresh >/dev/null || { echo "FAIL: backend did not start"; exit 1; }
  [[ -f "$V/phase-$n-seed.sh" ]] && bash "$V/phase-$n-seed.sh"
  echo "== phase-$n"
  bash "$ROOT/loops/_lib/playwright-verify.sh" "$V/phase-$n.md" || failed+=("phase-$n")
done
"$ROOT/backend/run.sh" start >/dev/null
echo "regression: ${#failed[@]} of $# failed${failed:+ (${failed[*]})}"
[[ ${#failed[@]} -eq 0 ]]
