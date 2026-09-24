#!/usr/bin/env bash
# BE-04 Learning resources. Expects a fresh backend on :8080.
source loops/_lib/curl-lib.sh

echo "## cards (US-LRN-1, US-LRN-2, FR-05, BR-8)"
req POST /api/learning-cards '{"title":" Spring in Action ","description":"Book, Manning"}'
expect_status 201 "add card"; C=$(jqr .id)
expect_jq '.title == "Spring in Action" and .status == "NOT_STARTED" and .createdAt != null and .milestones == [] and .notes == [] and .milestonesTotal == 0' "defaults"
req POST /api/learning-cards '{"title":"Rust course","status":"IN_PROGRESS"}'; expect_status 201 "add with status"; R=$(jqr .id)
req POST /api/learning-cards '{"description":"no title"}'; expect_status 400 "title required"; expect_jq '.errors[0].field == "title"' "title field error"
req POST /api/learning-cards '{"title":"x","status":"DONE"}'; expect_status 400 "invalid status"; expect_jq '.detail | contains("NOT_STARTED, IN_PROGRESS, COMPLETED")' "allowed values"
req PUT /api/learning-cards/$C '{"title":"Spring in Action","description":"Book","status":"IN_PROGRESS"}'; expect_status 200 "update"; expect_jq '.status == "IN_PROGRESS"' "status changed"
req GET /api/learning-cards; expect_jq 'length == 2' "list"

echo "## milestones (US-LRN-3, US-LRN-4, FR-06, BR-9)"
req POST /api/learning-cards/$C/milestones '{"title":"Chapter 1","targetDate":"2026-10-01"}'; expect_status 201 "add milestone"
M1=$(jqr '.milestones[0].id'); expect_jq '.milestones[0].done == false and .milestones[0].targetDate == "2026-10-01" and .milestonesTotal == 1' "milestone saved"
req POST /api/learning-cards/$C/milestones '{"title":"Chapter 2"}'; M2=$(jqr '.milestones[1].id'); expect_jq '.milestonesTotal == 2 and .milestones[1].targetDate == null' "target date optional"
req POST /api/learning-cards/$C/milestones '{"title":""}'; expect_status 400 "milestone title required"
req PATCH /api/learning-cards/$C/milestones/$M1 '{"done":true}'; expect_status 200 "complete milestone"
expect_jq ".milestones[0].done and .milestones[0].completedAt != null and .milestonesDone == 1 and .milestones[0].title == \"Chapter 1\"" "done, completedAt set, title kept"
req PATCH /api/learning-cards/$C/milestones/$M1 '{"done":false}'; expect_jq '.milestones[0].completedAt == null and .milestonesDone == 0' "reopen clears completedAt"
req PATCH /api/learning-cards/$C/milestones/$M1 '{"title":"Ch. 1","targetDate":"2026-10-05"}'; expect_jq '.milestones[0].title == "Ch. 1" and .milestones[0].targetDate == "2026-10-05"' "rename and re-date"
req PATCH /api/learning-cards/$R/milestones/$M1 '{"done":true}'; expect_status 404 "milestone through the wrong card is 404"
req DELETE /api/learning-cards/$C/milestones/$M2; expect_status 200 "remove milestone"; expect_jq '.milestonesTotal == 1' "removed"
req DELETE /api/learning-cards/$C/milestones/$M2; expect_status 404 "remove twice"

echo "## notes (US-LRN-5)"
req POST /api/learning-cards/$C/notes '{"text":"Chapter 1 covers DI"}'; expect_status 201 "add note"; N=$(jqr '.notes[0].id')
expect_jq '.notes[0].text == "Chapter 1 covers DI" and .notes[0].createdAt != null' "note with timestamp"
req POST /api/learning-cards/$C/notes '{"text":"  "}'; expect_status 400 "blank note rejected"
req DELETE /api/learning-cards/$R/notes/$N; expect_status 404 "note through the wrong card is 404"
req DELETE /api/learning-cards/$C/notes/$N; expect_status 200 "remove note"; expect_jq '.notes == []' "note removed"

echo "## delete card"
req POST /api/learning-cards/$C/notes '{"text":"keep"}'
req DELETE /api/learning-cards/$C; expect_status 204 "remove card"
req GET /api/learning-cards/$C; expect_status 404 "card gone"
req POST /api/learning-cards/$C/milestones '{"title":"x"}'; expect_status 404 "milestones of a deleted card"
req GET /api/learning-cards; expect_jq "length == 1 and .[0].id == $R" "only the other card left"

summary
