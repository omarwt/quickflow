#!/usr/bin/env bash
# BE-05 Plans. Expects a fresh backend on :8080 (timezone UTC).
source loops/_lib/curl-lib.sh
t() { date -u -d "$1" +%Y-%m-%dT%H:%M:%SZ; }
PAST_S=$(t '-3 hours'); PAST_E=$(t '-1 hour'); NOW_S=$(t '-30 minutes'); NOW_E=$(t '+90 minutes'); FUT_S=$(t '+1 day'); FUT_E=$(t '+1 day +2 hours')
TODAY=$(TZ=UTC date +%F)
plan() { echo "{\"title\":\"$1\",\"items\":$2,\"estimatedMinutes\":${6:-60},\"startDateTime\":\"$3\",\"endDateTime\":\"$4\",\"priorityOrder\":${5:-1}}"; }

echo "## sources"
req POST /api/tasks '{"title":"Write report"}';            TA=$(jqr .id)
req POST /api/tasks '{"title":"Archived one"}';            TX=$(jqr .id); req POST /api/tasks/$TX/archive
req POST /api/habits '{"name":"Read","frequency":"DAILY"}'; HB=$(jqr .id)
req POST /api/habits '{"name":"Old","frequency":"DAILY"}';  HX=$(jqr .id); req POST /api/habits/$HX/deactivate
req POST /api/learning-cards '{"title":"Kotlin book"}';     LC=$(jqr .id)
req GET /api/plans/sources; expect_status 200 "sources"
expect_jq "([.tasks[].id] == [$TA]) and ([.habits[].id] == [$HB]) and ([.learningResources[].id] == [$LC])" "archived tasks and inactive habits not selectable"
ITEMS="[{\"sourceType\":\"TASK\",\"sourceId\":$TA},{\"sourceType\":\"HABIT\",\"sourceId\":$HB},{\"sourceType\":\"LEARNING_RESOURCE\",\"sourceId\":$LC}]"

echo "## create (US-PLAN-1..4, BR-10, BR-11)"
req POST /api/plans "$(plan 'Deep work' "$ITEMS" $NOW_S $NOW_E 2 90)"; expect_status 201 "create in-progress plan"; P=$(jqr .id)
expect_jq '.status == "IN_PROGRESS" and .totalCount == 3 and .doneCount == 0 and .progressPercent == 0 and .estimatedMinutes == 90 and .priorityOrder == 2' "fields and status"
expect_jq '.restSeconds > 5000 and .restSeconds <= 5400' "rest time counts to end"
expect_jq '[.items[].title] == ["Write report","Read","Kotlin book"] and all(.items[]; .sourceAvailable and (.done | not))' "items resolved"
req POST /api/plans "$(plan 'Tomorrow' "[{\"sourceType\":\"TASK\",\"sourceId\":$TA}]" $FUT_S $FUT_E 1)"; F=$(jqr .id)
expect_jq '.status == "NOT_STARTED" and .restSeconds == null' "future plan not started, no rest time (BR-12)"
req POST /api/plans "$(plan 'Yesterday' "[{\"sourceType\":\"LEARNING_RESOURCE\",\"sourceId\":$LC}]" $PAST_S $PAST_E 3)"; OLD=$(jqr .id)
expect_jq '.status == "COMPLETED" and .restSeconds == null and .progressPercent == 0' "past plan completed at 0%"
req POST /api/plans "$(plan 'x' '[]' $NOW_S $NOW_E)"; expect_status 400 "no items (BR-10)"; expect_jq '.errors[0].field == "items"' "items field error"
req POST /api/plans "$(plan 'x' '[{"sourceType":"TASK","sourceId":99999}]' $NOW_S $NOW_E)"; expect_status 400 "unknown source (BR-10)"; expect_jq '.errors[0].field == "items[0]"' "item field error"
req POST /api/plans "$(plan 'x' "[{\"sourceType\":\"TASK\",\"sourceId\":$TX}]" $NOW_S $NOW_E)"; expect_status 400 "archived task rejected"
req POST /api/plans "$(plan 'x' "[{\"sourceType\":\"HABIT\",\"sourceId\":$HX}]" $NOW_S $NOW_E)"; expect_status 400 "inactive habit rejected"
req POST /api/plans "$(plan 'x' "[{\"sourceType\":\"TASK\",\"sourceId\":$TA},{\"sourceType\":\"TASK\",\"sourceId\":$TA}]" $NOW_S $NOW_E)"; expect_status 400 "duplicate item rejected"
req POST /api/plans "$(plan 'x' "[{\"sourceType\":\"TASK\",\"sourceId\":$TA}]" $NOW_E $NOW_S)"; expect_status 400 "end before start (BR-11)"; expect_jq '.errors[0].field == "endDateTime"' "endDateTime field error"
req POST /api/plans "$(plan 'x' "[{\"sourceType\":\"TASK\",\"sourceId\":$TA}]" $NOW_S $NOW_S)"; expect_status 400 "end equal to start"
req POST /api/plans "$(plan 'x' "[{\"sourceType\":\"TASK\",\"sourceId\":$TA}]" $NOW_S $NOW_E 0)"; expect_status 400 "priority 0 rejected"
req POST /api/plans "$(plan 'x' "[{\"sourceType\":\"TASK\",\"sourceId\":$TA}]" $NOW_S $NOW_E 1 0)"; expect_status 400 "duration 0 rejected"
req POST /api/plans "$(plan 'x' '[{"sourceType":"BOOK","sourceId":1}]' $NOW_S $NOW_E)"; expect_status 400 "invalid source type"

echo "## item done + BR-13 (US-PLAN-5, US-PLAN-9, FR-08)"
IT=$(curl -s $BASE/api/plans/$P | jq '.items[0].id'); IH=$(curl -s $BASE/api/plans/$P | jq '.items[1].id'); IL=$(curl -s $BASE/api/plans/$P | jq '.items[2].id')
req PATCH /api/plans/$P/items/$IT '{"done":true}'; expect_status 200 "task item done"; expect_jq '.doneCount == 1 and .progressPercent == 33 and .status == "IN_PROGRESS"' "progress 33%"
req GET /api/tasks/$TA; expect_jq '.status == "DONE"' "task item completed the task"
req PATCH /api/plans/$P/items/$IH '{"done":true}'; expect_jq '.progressPercent == 67' "progress 67%"
req GET /api/habits/$HB/completions; expect_jq "length == 1 and .[0].completionDate == \"$TODAY\"" "habit item recorded today's completion"
req PATCH /api/plans/$P/items/$IH '{"done":false}'; req GET /api/habits/$HB/completions; expect_jq 'length == 0' "undo removes today's completion"
req PATCH /api/plans/$P/items/$IH '{"done":true}'
req PATCH /api/plans/$P/items/$IL '{"done":true}'; expect_jq '.progressPercent == 100 and .status == "COMPLETED" and .restSeconds == null' "all done -> COMPLETED"
req GET /api/learning-cards/$LC; expect_jq '.status == "NOT_STARTED"' "learning item leaves the card unchanged"
req PATCH /api/plans/$P/items/$IT '{"done":false}'; expect_jq '.status == "IN_PROGRESS" and .progressPercent == 67' "undo reopens plan"
req GET /api/tasks/$TA; expect_jq '.status == "TODO"' "task reopened"
req PATCH /api/plans/$P/items/99999 '{"done":true}'; expect_status 404 "unknown item"
req PATCH /api/plans/$P/items/$IT '{}'; expect_status 400 "done required"

echo "## deleted source keeps the item (I-5)"
req DELETE /api/learning-cards/$LC
req GET /api/plans/$P; expect_jq '.items[2].sourceAvailable == false and .items[2].title == "Kotlin book" and .totalCount == 3' "snapshot title, still counted"

echo "## grouping, history, notifications (US-PLAN-7, US-PLAN-10)"
req GET "/api/plans?group=ACTIVE"; expect_jq "[.[].id] == [$F,$P]" "active sorted by priority"
req GET "/api/plans?group=COMPLETED"; expect_jq "[.[].id] == [$OLD] and .[0].progressPercent == 0" "history with completion %"
req GET /api/plans/start-notifications; expect_jq "[.[].id] == [$P]" "started plan needs a notification"
req POST /api/plans/$P/start-notification/ack; expect_status 200 "ack"; expect_jq '.startNotified' "acknowledged"
req GET /api/plans/start-notifications; expect_jq 'length == 0' "notified only once"
req POST /api/plans/$F/start-notification/ack; expect_status 409 "cannot ack a plan that hasn't started"

echo "## remove (US-PLAN-6)"
req DELETE /api/plans/$F; expect_status 204 "remove plan"
req GET /api/plans/$F;    expect_status 404 "removed plan gone"
req GET /api/tasks/$TA;   expect_status 200 "removing a plan leaves its task"

summary
