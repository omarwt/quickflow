#!/usr/bin/env bash
# screenshots.sh <out dir> [url] - headless Chrome screenshots of every page at several widths (default 390, 1280).
# Uses a throwaway profile, so it never touches your own browser. Limit with PAGES="/tasks /habits";
# pick sizes with SIZES="320x640 390x844 768x1024 1024x768 1440x900 1920x1080" (the FE-08 matrix).
set -euo pipefail
OUT="${1:?out dir required}"; URL="${2:-http://localhost:5173}"
PAGES="${PAGES:-/dashboard /tasks /habits /learning /plans /settings}"
CHROME="$(command -v google-chrome || command -v chromium || command -v chromium-browser)"
mkdir -p "$OUT"; PROFILE="$(mktemp -d)"; trap 'rm -rf "$PROFILE"' EXIT
for p in $PAGES; do
  for s in ${SIZES:-390x844 1280x900}; do
    w=${s%x*}; h=${s#*x}
    "$CHROME" --headless=new --disable-gpu --no-first-run --user-data-dir="$PROFILE" --hide-scrollbars \
      --virtual-time-budget=4000 --window-size="$w,$h" --screenshot="$OUT/${p#/}-$w.png" "$URL$p" >/dev/null 2>&1
  done
done
ls "$OUT"
