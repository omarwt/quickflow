# Tasks — backend-dev

Input: `PRD.md` · Mode: prd · Status: **completed**

`[ ]` not started · `[-]` in progress · `[x]` completed · `[!]` blocked

## BE-01 Foundation (done)

- [x] T1 Choose stack and record it in docs/architecture.md
- [x] T2 Project skeleton, config, persistence and migrations
- [x] T3 Uniform error format and validation handling
- [x] T4 Swagger/OpenAPI and CORS
- [x] T5 Settings resource (profile, preferences, timezone)
- [x] T6 Verify with curl
- [x] T7 Document phase

## BE-02 Tasks (done)

- [x] T1 Task model and migration
- [x] T2 CRUD, complete/reopen, archive/restore, delete
- [x] T3 Search, filters, sorting, overdue
- [x] T4 Unit tests for task rules
- [x] T5 Verify with curl
- [x] T6 Document phase

## BE-03 Habits (done)

- [x] T1 Habit and completion models, unique habit/date
- [x] T2 CRUD, activate/deactivate
- [x] T3 Complete/undo for a date, duplicate prevention
- [x] T4 Progress: streak and current period
- [x] T5 Unit tests for streak rules
- [x] T6 Verify with curl
- [x] T7 Document phase

## BE-04 Learning resources (done)

- [x] T1 Card, milestone and note models
- [x] T2 Card CRUD
- [x] T3 Milestones: add, complete, remove
- [x] T4 Notes: add, remove
- [x] T5 Verify with curl
- [x] T6 Document phase

## BE-05 Plans (done)

- [x] T1 Plan and plan-item models
- [x] T2 Create from existing items with validation
- [x] T3 Status, progress and rest-time rules
- [x] T4 Item toggle with BR-13 propagation
- [x] T5 Remove, history, start notifications
- [x] T6 Unit tests for plan lifecycle
- [x] T7 Verify with curl
- [x] T8 Document phase

## BE-06 Dashboard (done)

- [x] T1 Dashboard aggregate endpoint
- [x] T2 Unit test for completion percentage
- [x] T3 Verify with curl, cross-checking list endpoints
- [x] T4 Document phase

## BE-07 API regression (done)

- [x] T1 Run every curl script on a fresh database
- [x] T2 Check response times under 500 ms
- [x] T3 Confirm Swagger documents every endpoint
- [x] T4 Verify
- [x] T5 Document phase
