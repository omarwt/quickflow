#!/usr/bin/env bash
# Setup for phase-10.md (fresh backend): FE-07 data, an overdue task, one task already done today and a plan in progress.
set -euo pipefail
bash "$(dirname "$0")/phase-07-seed.sh"
B=http://localhost:8080/api; J=(-s -H 'Content-Type: application/json')
t() { date -u -d "$1" +%Y-%m-%dT%H:%M:%SZ; }
curl "${J[@]}" -X POST $B/tasks -d "{\"title\":\"Renew passport\",\"priority\":\"HIGH\",\"dueDate\":\"$(date -u -d yesterday +%F)\"}" >/dev/null
D=$(curl "${J[@]}" -X POST $B/tasks -d '{"title":"Water plants"}' | jq .id); curl "${J[@]}" -X POST $B/tasks/$D/complete >/dev/null
T=$(curl "${J[@]}" $B/tasks | jq '[.[] | select(.title=="Write report")][0].id')
curl "${J[@]}" -X POST $B/plans -d "{\"title\":\"Focus block\",\"items\":[{\"sourceType\":\"TASK\",\"sourceId\":$T}],\"estimatedMinutes\":45,\"startDateTime\":\"$(t '-10 minutes')\",\"endDateTime\":\"$(t '+50 minutes')\",\"priorityOrder\":1}" >/dev/null
C=$(curl "${J[@]}" $B/learning-cards | jq '[.[] | select(.title=="Rust course")][0].id')
curl "${J[@]}" -X PUT $B/learning-cards/$C -d '{"title":"Rust course","status":"IN_PROGRESS"}' >/dev/null
echo "seeded: overdue 'Renew passport', done 'Water plants', in-progress plan 'Focus block', 'Rust course' in progress"
