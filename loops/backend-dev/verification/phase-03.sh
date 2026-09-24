#!/usr/bin/env bash
# BE-03 Habits. Expects a fresh backend on :8080 (timezone UTC).
source loops/_lib/curl-lib.sh
d() { TZ=UTC date -d "$1" +%F; }
TODAY=$(d today); Y1=$(d yesterday); Y2=$(d '2 days ago'); Y5=$(d '5 days ago'); TMRW=$(d tomorrow)
N150=$(printf 'n%.0s' {1..150}); N151=$(printf 'n%.0s' {1..151})

echo "## create (US-HAB-1, US-HAB-2, BR-6)"
req POST /api/habits '{"name":" Morning run ","description":"5 km","frequency":"DAILY"}'
expect_status 201 "create daily"; H=$(jqr .id)
expect_jq '.name == "Morning run" and .active and .progress.currentStreak == 0 and .progress.completedToday == false' "defaults and empty progress"
req POST /api/habits '{"name":"Weekly review","frequency":"WEEKLY"}'; expect_status 201 "create weekly"; W=$(jqr .id)
req POST /api/habits "{\"name\":\"$N150\",\"frequency\":\"DAILY\"}"; expect_status 201 "150-char name accepted"; X=$(jqr .id)
req POST /api/habits "{\"name\":\"$N151\",\"frequency\":\"DAILY\"}"; expect_status 400 "151-char name rejected"
req POST /api/habits '{"frequency":"DAILY"}'; expect_status 400 "missing name"; expect_jq '.errors[0].field == "name"' "name field error"
req POST /api/habits '{"name":"x"}';          expect_status 400 "missing frequency"
req POST /api/habits '{"name":"x","frequency":"MONTHLY"}'; expect_status 400 "invalid frequency"; expect_jq '.detail | contains("DAILY, WEEKLY")' "allowed values"

echo "## complete (US-HAB-3, FR-04, BR-7)"
req POST /api/habits/$H/completions; expect_status 201 "complete today"
expect_jq '.progress.completedToday and .progress.completedThisPeriod and .progress.currentStreak == 1' "progress updated"
req POST /api/habits/$H/completions "{\"date\":\"$TODAY\"}"; expect_status 409 "duplicate same date rejected"
req GET /api/habits/$H/completions; expect_jq "length == 1 and .[0].completionDate == \"$TODAY\"" "only one record"
req POST /api/habits/$H/completions "{\"date\":\"$TMRW\"}"; expect_status 400 "future date rejected"; expect_jq '.errors[0].field == "date"' "date field error"
req POST /api/habits/99999/completions; expect_status 404 "unknown habit"

echo "## progress (US-HAB-4)"
req POST /api/habits/$H/completions "{\"date\":\"$Y1\"}"; expect_status 201 "backfill yesterday"
req POST /api/habits/$H/completions "{\"date\":\"$Y2\"}"; expect_jq '.progress.currentStreak == 3' "3-day streak"
req POST /api/habits/$H/completions "{\"date\":\"$Y5\"}"; expect_jq '.progress.currentStreak == 3 and .progress.totalCompletions == 4' "gap does not extend streak"
req DELETE /api/habits/$H/completions/$TODAY; expect_status 200 "undo today"; expect_jq '.progress.completedToday == false and .progress.currentStreak == 2' "streak alive until day ends"
req DELETE /api/habits/$H/completions/$TODAY; expect_status 404 "undo twice"
req POST /api/habits/$W/completions; expect_jq '.progress.completedThisPeriod and .progress.currentStreak == 1' "weekly done this week"

echo "## update / deactivate / delete (US-HAB-5, FR-03)"
req PUT /api/habits/$W '{"name":"Weekly planning","frequency":"WEEKLY"}'; expect_status 200 "update"; expect_jq '.name == "Weekly planning"' "renamed"
req PUT /api/habits/$W '{"name":"","frequency":"WEEKLY"}'; expect_status 400 "update validates"
req POST /api/habits/$X/deactivate; expect_jq '.active == false' "deactivated"
req POST /api/habits/$X/completions; expect_status 409 "inactive habit cannot be completed"
req GET "/api/habits?active=true";  expect_jq "length == 2 and ([.[].id] | index($X) | not)" "active filter"
req GET "/api/habits?active=false"; expect_jq "length == 1 and .[0].id == $X" "inactive filter"
req POST /api/habits/$X/activate;   expect_jq '.active' "reactivated"
req DELETE /api/habits/$H; expect_status 204 "delete"
req GET /api/habits/$H;    expect_status 404 "deleted habit gone"
req GET /api/habits/$H/completions; expect_status 404 "its completions gone"
req GET /api/habits;       expect_jq 'length == 2' "list shrinks"

summary
