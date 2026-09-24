#!/usr/bin/env bash
# Setup for phase-05.md (fresh backend): source items to plan with, one finished plan for the history,
# and a plan that starts ~90 s from now to test the start notification.
set -euo pipefail
B=${API:-http://localhost:8080}/api; J=(-s -H 'Content-Type: application/json')
t() { date -u -d "$1" +%Y-%m-%dT%H:%M:%SZ; }
T1=$(curl "${J[@]}" -X POST $B/tasks -d '{"title":"Write report"}' | jq .id)
curl "${J[@]}" -X POST $B/tasks -d '{"title":"Pay bills"}' >/dev/null
H1=$(curl "${J[@]}" -X POST $B/habits -d '{"name":"Morning run","frequency":"DAILY"}' | jq .id)
L1=$(curl "${J[@]}" -X POST $B/learning-cards -d '{"title":"Spring in Action"}' | jq .id)
curl "${J[@]}" -X POST $B/plans -d "{\"title\":\"Yesterday review\",\"items\":[{\"sourceType\":\"LEARNING_RESOURCE\",\"sourceId\":$L1}],\"estimatedMinutes\":30,\"startDateTime\":\"$(t '-26 hours')\",\"endDateTime\":\"$(t '-25 hours')\",\"priorityOrder\":3}" >/dev/null
curl "${J[@]}" -X POST $B/plans -d "{\"title\":\"Soon\",\"items\":[{\"sourceType\":\"HABIT\",\"sourceId\":$H1}],\"estimatedMinutes\":20,\"startDateTime\":\"$(t '+90 seconds')\",\"endDateTime\":\"$(t '+1 hour')\",\"priorityOrder\":2}" >/dev/null
echo "seeded: task $T1, habit $H1, card $L1, plans 'Yesterday review' (past) and 'Soon' (starts in 90 s)"
