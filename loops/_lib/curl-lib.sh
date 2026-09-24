#!/usr/bin/env bash
# curl-lib.sh - tiny assertion harness for backend-dev curl verification suites.
#
#   source loops/_lib/curl-lib.sh
#   BASE=http://localhost:8080
#   req POST /api/things '{"name":"x"}'   # sets $STATUS and $BODY, prints the exchange
#   expect_status 201 "create thing"
#   expect_jq '.name == "x"' "name echoed"
#   ID=$(jqr '.id')
#   summary                                # prints totals, exits non-zero on any failure
#
# Every request/response is echoed so the suite log doubles as verification evidence.

BASE="${BASE:-http://localhost:8080}"
PASS=0
FAIL=0
STATUS=""
BODY=""
FAILED_CHECKS=()

req() {
  local method="$1" path="$2" data="${3:-}"
  local args=(-s -o /tmp/curl-lib-body.$$ -w '%{http_code}' -X "$method" "$BASE$path" -H 'Accept: application/json')
  if [[ -n "$data" ]]; then
    args+=(-H 'Content-Type: application/json' --data "$data")
  fi
  STATUS="$(curl "${args[@]}")"
  BODY="$(cat /tmp/curl-lib-body.$$ 2>/dev/null)"
  rm -f /tmp/curl-lib-body.$$
  echo "> curl -X $method '$BASE$path'${data:+ -d '$data'}"
  echo "< $STATUS ${BODY:0:600}"
}

_ok()   { PASS=$((PASS + 1)); echo "  PASS $1"; }
_bad()  { FAIL=$((FAIL + 1)); FAILED_CHECKS+=("$1"); echo "  FAIL $1 -- $2"; }

expect_status() {
  local want="$1" label="$2"
  if [[ "$STATUS" == "$want" ]]; then _ok "$label (HTTP $want)"; else _bad "$label" "expected HTTP $want, got $STATUS"; fi
}

expect_jq() {
  local filter="$1" label="$2"
  if [[ "$(printf '%s' "$BODY" | jq -e "$filter" 2>/dev/null)" == "true" ]]; then _ok "$label"; else _bad "$label" "jq '$filter' not true"; fi
}

jqr() { printf '%s' "$BODY" | jq -r "$1"; }

wait_for() {
  local url="$1" tries="${2:-60}"
  for _ in $(seq "$tries"); do
    curl -sf -o /dev/null "$url" && return 0
    sleep 1
  done
  echo "service at $url did not come up" >&2
  return 1
}

summary() {
  echo
  echo "curl suite: $PASS passed, $FAIL failed"
  if (( FAIL > 0 )); then
    printf '  failed: %s\n' "${FAILED_CHECKS[@]}"
    exit 1
  fi
}
