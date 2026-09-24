#!/usr/bin/env bash
# Setup for phase-07.md (fresh backend): FE-05 data plus a task due today and a card with one milestone.
set -euo pipefail
bash "$(dirname "$0")/phase-05-seed.sh"
B=http://localhost:8080/api; J=(-s -H 'Content-Type: application/json')
curl "${J[@]}" -X POST $B/tasks -d "{\"title\":\"Call dentist\",\"dueDate\":\"$(date -u +%F)\"}" >/dev/null
C=$(curl "${J[@]}" -X POST $B/learning-cards -d '{"title":"Rust course"}' | jq .id)
curl "${J[@]}" -X POST $B/learning-cards/$C/milestones -d '{"title":"Ownership chapter"}' >/dev/null
echo "seeded: task 'Call dentist' due today, card 'Rust course' with 1 milestone"
