#!/usr/bin/env bash
# screenshots.sh <out dir> [url] - headless Chrome screenshots of every page at 390 px and 1280 px wide.
# Uses a throwaway profile, so it never touches your own browser. Pass PAGES="/tasks /habits" to limit.
set -euo pipefail
OUT="${1:?out dir required}"; URL="${2:-http://localhost:5173}"
PAGES="${PAGES:-/dashboard /tasks /habits /learning /plans /settings}"
CHROME="$(command -v google-chrome || command -v chromium || command -v chromium-browser)"
mkdir -p "$OUT"; PROFILE="$(mktemp -d)"; trap 'rm -rf "$PROFILE"' EXIT
for p in $PAGES; do
  for w in 390 1280; do
    h=$([[ $w == 390 ]] && echo 844 || echo 900)
    "$CHROME" --headless=new --disable-gpu --no-first-run --user-data-dir="$PROFILE" --hide-scrollbars \
      --virtual-time-budget=4000 --window-size="$w,$h" --screenshot="$OUT/${p#/}-$w.png" "$URL$p" >/dev/null 2>&1
  done
done
ls "$OUT"
