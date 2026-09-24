#!/usr/bin/env bash
# BE-06 Dashboard. Expects a fresh backend on :8080 (timezone UTC).
# Every dashboard number is cross-checked against the list endpoints (TR-3).
source loops/_lib/curl-lib.sh
TODAY=$(TZ=UTC date +%F); YDAY=$(TZ=UTC date -d yesterday +%F)
t() { date -u -d "$1" +%Y-%m-%dT%H:%M:%SZ; }

req GET /api/dashboard; expect_status 200 "empty dashboard"
expect_jq '.tasks.total == 0 and .tasks.completionPercent == 0 and .habits.active == 0 and .plans.inProgress == [] and .learning.milestonesTotal == 0' "all zero on empty data"

echo "## seed"
req POST /api/tasks "{\"title\":\"Due today\",\"dueDate\":\"$TODAY\"}";  T1=$(jqr .id)
req POST /api/tasks "{\"title\":\"Late\",\"dueDate\":\"$YDAY\"}";        T2=$(jqr .id)
req POST /api/tasks '{"title":"Someday"}';                               T3=$(jqr .id)
req POST /api/tasks '{"title":"Archived"}';                              T4=$(jqr .id); req POST /api/tasks/$T4/complete; req POST /api/tasks/$T4/archive
req POST /api/tasks/$T3/complete
req POST /api/habits '{"name":"Run","frequency":"DAILY"}';   H1=$(jqr .id); req POST /api/habits/$H1/completions
req POST /api/habits '{"name":"Review","frequency":"WEEKLY"}'; H2=$(jqr .id)
req POST /api/habits '{"name":"Off","frequency":"DAILY"}';   H3=$(jqr .id); req POST /api/habits/$H3/deactivate
req POST /api/learning-cards '{"title":"Book","status":"IN_PROGRESS"}'; L1=$(jqr .id)
req POST /api/learning-cards/$L1/milestones '{"title":"Ch1"}'; M1=$(jqr '.milestones[0].id')
req POST /api/learning-cards/$L1/milestones '{"title":"Ch2"}'
req PATCH /api/learning-cards/$L1/milestones/$M1 '{"done":true}'
req POST /api/learning-cards '{"title":"Course"}'
req POST /api/plans "{\"title\":\"Now\",\"items\":[{\"sourceType\":\"TASK\",\"sourceId\":$T1},{\"sourceType\":\"LEARNING_RESOURCE\",\"sourceId\":$L1}],\"estimatedMinutes\":60,\"startDateTime\":\"$(t '-10 minutes')\",\"endDateTime\":\"$(t '+50 minutes')\",\"priorityOrder\":1}"; P=$(jqr .id)
req POST /api/plans "{\"title\":\"Later\",\"items\":[{\"sourceType\":\"HABIT\",\"sourceId\":$H2}],\"estimatedMinutes\":30,\"startDateTime\":\"$(t '+1 day')\",\"endDateTime\":\"$(t '+1 day +1 hour')\",\"priorityOrder\":2}"

echo "## tasks (US-DASH-1, US-DASH-2, US-DASH-4)"
TASKS=$(curl -s "$BASE/api/tasks"); DUE=$(curl -s "$BASE/api/tasks?due=TODAY"); OVER=$(curl -s "$BASE/api/tasks?due=OVERDUE")
req GET /api/dashboard
expect_jq "[.tasks.dueToday[].id] == $(jq -c '[.[].id]' <<<"$DUE")" "due today matches ?due=TODAY"
expect_jq "[.tasks.overdue[].id] == $(jq -c '[.[].id] | sort' <<<"$OVER")" "overdue matches ?due=OVERDUE"
expect_jq ".tasks.total == $(jq length <<<"$TASKS") and .tasks.done == $(jq '[.[] | select(.status == "DONE")] | length' <<<"$TASKS")" "totals match task list (archived excluded)"
expect_jq '.tasks.completionPercent == 33 and .tasks.completedToday == 1' "33% done, 1 completed today (archived one excluded)"

echo "## habits (US-DASH-3)"
ACTIVE=$(curl -s "$BASE/api/habits?active=true")
expect_jq ".habits.active == $(jq length <<<"$ACTIVE") and ([.habits.today[].id] == $(jq -c '[.[].id]' <<<"$ACTIVE"))" "active habits match ?active=true"
expect_jq ".habits.completedToday == $(jq '[.[] | select(.progress.completedToday)] | length' <<<"$ACTIVE")" "completed today matches"

echo "## plans (US-DASH-5)"
expect_jq "[.plans.inProgress[].id] == [$P] and .plans.notStarted == 1 and .plans.completed == 0" "plan counts"
expect_jq '.plans.inProgress[0].restSeconds > 2900 and .plans.inProgress[0].progressPercent == 0' "rest time and progress"

echo "## learning (US-DASH-6)"
expect_jq '.learning.cardsByStatus.IN_PROGRESS == 1 and .learning.cardsByStatus.NOT_STARTED == 1 and .learning.milestonesDone == 1 and .learning.milestonesTotal == 2 and .learning.milestonesCompletedLast7Days == 1' "learning snapshot"

echo "## item change shows up immediately (FR-08)"
ITEM=$(curl -s "$BASE/api/plans/$P" | jq '.items[0].id')
req PATCH /api/plans/$P/items/$ITEM '{"done":true}'
req GET /api/dashboard
expect_jq '.plans.inProgress[0].progressPercent == 50' "plan progress updated on dashboard"
expect_jq '.tasks.completionPercent == 67 and .tasks.completedToday == 2' "task completed through the plan counts"

summary
