#!/usr/bin/env bash
# BE-02 Tasks. Expects a fresh backend on :8080 (timezone UTC).
source loops/_lib/curl-lib.sh
TODAY=$(TZ=UTC date +%F); YDAY=$(TZ=UTC date -d yesterday +%F); TMRW=$(TZ=UTC date -d tomorrow +%F)
T200=$(printf 'a%.0s' {1..200}); T201=$(printf 'a%.0s' {1..201}); D2001=$(printf 'd%.0s' {1..2001})

echo "## create (US-TASK-1, BR-1, BR-2)"
req POST /api/tasks "{\"title\":\" Write report \",\"description\":\"Q3\",\"priority\":\"HIGH\",\"dueDate\":\"$TODAY\"}"
expect_status 201 "create"; A=$(jqr .id)
expect_jq '.title == "Write report" and .status == "TODO" and .priority == "HIGH" and .archived == false and .completedAt == null and .overdue == false' "defaults, trimmed, due today not overdue"
req POST /api/tasks '{"title":"Minimal"}'; expect_status 201 "title only"; expect_jq '.priority == "MEDIUM"' "priority defaults to MEDIUM"; M=$(jqr .id)
req POST /api/tasks "{\"title\":\"Pay bills\",\"priority\":\"LOW\",\"dueDate\":\"$YDAY\"}"; B=$(jqr .id); expect_jq '.overdue' "due yesterday is overdue"
req POST /api/tasks "{\"title\":\"Plan trip\",\"status\":\"IN_PROGRESS\",\"dueDate\":\"$TMRW\"}"; C=$(jqr .id)
req POST /api/tasks "{\"title\":\"$T200\"}"; expect_status 201 "200-char title accepted"; E=$(jqr .id)

echo "## validation (BR-1..3)"
req POST /api/tasks '{"description":"x"}';           expect_status 400 "missing title"; expect_jq '.errors[0].field == "title"' "title field error"
req POST /api/tasks '{"title":"   "}';                expect_status 400 "blank title"
req POST /api/tasks "{\"title\":\"$T201\"}";          expect_status 400 "201-char title rejected"
req POST /api/tasks "{\"title\":\"x\",\"description\":\"$D2001\"}"; expect_status 400 "description over 2000"; expect_jq '.errors[0].field == "description"' "description field error"
req POST /api/tasks '{"title":"x","status":"FINISHED"}'; expect_status 400 "invalid status"; expect_jq '.errors[0].field == "status" and (.detail | contains("TODO, IN_PROGRESS, DONE"))' "allowed statuses listed"
req POST /api/tasks '{"title":"x","priority":"URGENT"}'; expect_status 400 "invalid priority"
req POST /api/tasks '{"title":"x","dueDate":"31-12-2026"}'; expect_status 400 "bad date format"

echo "## read / update (US-TASK-2)"
req GET /api/tasks/$A; expect_status 200 "get"; expect_jq ".id == $A" "right task"
req PUT /api/tasks/$A "{\"title\":\"Write Q3 report\",\"status\":\"IN_PROGRESS\",\"priority\":\"MEDIUM\",\"dueDate\":\"$TODAY\"}"
expect_status 200 "update"; expect_jq '.title == "Write Q3 report" and .status == "IN_PROGRESS" and .priority == "MEDIUM" and .description == null' "fields replaced"
req PUT /api/tasks/$A '{"title":""}'; expect_status 400 "update validates"
req PUT /api/tasks/99999 '{"title":"x"}'; expect_status 404 "update unknown id"

echo "## complete / reopen (US-TASK-3, BR-5)"
req POST /api/tasks/$B/complete; expect_status 200 "complete"; expect_jq '.status == "DONE" and .completedAt != null and .overdue == false' "done, completedAt set, not overdue"
req POST /api/tasks/$B/reopen;   expect_jq '.status == "TODO" and .completedAt == null and .overdue' "reopened, overdue again"
req PUT /api/tasks/$C "{\"title\":\"Plan trip\",\"status\":\"DONE\",\"dueDate\":\"$TMRW\"}"; expect_jq '.completedAt != null' "DONE via update sets completedAt"
req POST /api/tasks/99999/complete; expect_status 404 "complete unknown id"

echo "## search / filter (US-TASK-5..7, FR-02)"
req GET "/api/tasks?search=REPORT";  expect_jq "length == 1 and .[0].id == $A" "case-insensitive search"
req GET "/api/tasks?search=%25";     expect_jq 'length == 0' "wildcards escaped"
req GET "/api/tasks?status=DONE";    expect_jq "length == 1 and .[0].id == $C" "status filter"
req GET "/api/tasks?priority=LOW";   expect_jq "length == 1 and .[0].id == $B" "priority filter"
req GET "/api/tasks?status=TODO&priority=LOW"; expect_jq 'length == 1' "combined filters"
req GET "/api/tasks?due=OVERDUE";    expect_jq "length == 1 and .[0].id == $B" "overdue"
req GET "/api/tasks?due=TODAY";      expect_jq "length == 1 and .[0].id == $A" "due today"
req GET "/api/tasks?due=UPCOMING";   expect_jq "length == 1 and .[0].id == $C" "upcoming"
req GET "/api/tasks?due=NONE";       expect_jq 'length == 2' "no due date"
req GET "/api/tasks?dueFrom=$YDAY&dueTo=$TODAY"; expect_jq 'length == 2' "date range"
req GET "/api/tasks?dueFrom=$TMRW&dueTo=$YDAY";  expect_status 400 "inverted range"
req GET "/api/tasks?status=BOGUS";   expect_status 400 "bad status param"; expect_jq '.errors[0].field == "status"' "param field error"

echo "## sort"
req GET "/api/tasks?sort=DUE_DATE&direction=ASC";  expect_jq "[.[].id][0:3] == [$B,$A,$C] and .[-1].dueDate == null" "due asc, undated last"
req GET "/api/tasks?sort=DUE_DATE&direction=DESC"; expect_jq "[.[].id][0:3] == [$C,$A,$B] and .[-1].dueDate == null" "due desc, undated last"
req GET "/api/tasks?direction=ASC"; expect_jq ".[0].id == $A" "created asc"
req GET /api/tasks;                 expect_jq ".[0].id == $E and length == 5" "default newest first"

echo "## archive / restore / delete (US-TASK-4, BR-4, BR-14)"
req POST /api/tasks/$M/archive; expect_jq '.archived' "archived"
req GET /api/tasks;             expect_jq "length == 4 and ([.[].id] | index($M) | not)" "hidden from default list"
req GET "/api/tasks?archived=true"; expect_jq "length == 1 and .[0].id == $M" "archived view"
req POST /api/tasks/$M/restore; expect_jq '.archived == false' "restored"
req DELETE /api/tasks/$E;       expect_status 204 "delete"
req GET /api/tasks/$E;          expect_status 404 "deleted task not returned"
req GET /api/tasks;             expect_jq "length == 4" "deleted task not listed"
req DELETE /api/tasks/$E;       expect_status 404 "second delete 404"

summary
