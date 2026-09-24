#!/usr/bin/env bash
# Setup for phase-09.md (fresh backend): the FE-07 data, plus more tasks so /tasks is taller than a phone screen.
set -euo pipefail
bash "$(dirname "$0")/phase-07-seed.sh"
for i in 1 2 3 4 5 6 7 8; do
  curl -s -H 'Content-Type: application/json' -X POST http://localhost:8080/api/tasks -d "{\"title\":\"Filler task $i\"}" >/dev/null
done
echo "seeded: 8 filler tasks"
