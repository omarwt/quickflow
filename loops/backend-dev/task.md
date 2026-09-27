# Tasks — backend-dev

Input: `PRD.md` · Mode: PRD · Status: **completed**

This is the backend plan and checklist, kept by hand. Tick a task when it is finished and change
a phase's status when it starts, finishes or gets blocked. A phase can start only when every
phase it depends on is done.

`[ ]` not started · `[-]` in progress · `[x]` completed · `[!]` blocked

## BE-01 Foundation — done

Depends on: nothing

- [x] T1 Choose the stack and record it in docs/architecture.md
- [x] T2 Project skeleton, config, persistence and migrations
- [x] T3 Uniform error format and validation handling
- [x] T4 Swagger/OpenAPI and CORS
- [x] T5 Settings resource: profile, preferences, timezone
- [x] T6 Verify with curl
- [x] T7 Document phase

## BE-02 Tasks — done

Depends on: BE-01

- [x] T1 Task model and migration
- [x] T2 Create, read, update, complete, reopen, archive, restore, delete
- [x] T3 Search, filters, sorting, overdue
- [x] T4 Unit tests for the task rules
- [x] T5 Verify with curl
- [x] T6 Document phase

## BE-03 Habits — done

Depends on: BE-01

- [x] T1 Habit and completion models, one completion per habit and day
- [x] T2 Create, read, update, activate, deactivate
- [x] T3 Complete and undo for a date, without duplicates
- [x] T4 Progress: streak and current period
- [x] T5 Unit tests for the streak rules
- [x] T6 Verify with curl
- [x] T7 Document phase

## BE-04 Learning resources — done

Depends on: BE-01

- [x] T1 Card, milestone and note models
- [x] T2 Card create, read, update, delete
- [x] T3 Milestones: add, complete, remove
- [x] T4 Notes: add, remove
- [x] T5 Verify with curl
- [x] T6 Document phase

## BE-05 Plans — done

Depends on: BE-02, BE-03, BE-04

- [x] T1 Plan and plan-item models
- [x] T2 Create a plan from existing items, with validation
- [x] T3 Status, progress and rest-time rules
- [x] T4 Toggle an item and propagate it to the source item (BR-13)
- [x] T5 Remove, history, start notifications
- [x] T6 Unit tests for the plan lifecycle
- [x] T7 Verify with curl
- [x] T8 Document phase

## BE-06 Dashboard — done

Depends on: BE-05

- [x] T1 Dashboard aggregate endpoint
- [x] T2 Unit test for the completion percentage
- [x] T3 Verify with curl, cross-checking the list endpoints
- [x] T4 Document phase

## BE-07 API regression — done

Depends on: BE-06

- [x] T1 Run every curl script on a fresh database
- [x] T2 Check response times stay under 500 ms
- [x] T3 Confirm Swagger documents every endpoint
- [x] T4 Verify
- [x] T5 Document phase
