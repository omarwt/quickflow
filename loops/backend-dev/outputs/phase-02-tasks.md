# BE-02 Tasks

## Requirements covered

- FR-01
- FR-02
- BR-1
- BR-2
- BR-3
- BR-4
- BR-5
- BR-14
- US-TASK-1
- US-TASK-2
- US-TASK-3
- US-TASK-4
- US-TASK-5
- US-TASK-6
- US-TASK-7
- I-3
- I-4
- I-14
- I-20

## Tasks

- T1 Task model and migration
- T2 CRUD, complete/reopen, archive/restore, delete
- T3 Search, filters, sorting, overdue
- T4 Unit tests for task rules
- T5 Verify with curl
- T6 Document phase

## Implementation

- **Rules on the entity.** `Task.setStatus` is the only way to change status. Entering DONE stamps `completedAt`, and leaving DONE clears it (BR-5, I-14). A database CHECK enforces the same rule, and the status and priority enums have CHECK constraints (BR-3). `isOverdue(today)` implements I-3.
- **Query (FR-02).** A single JPA Specification handles everything. Search is a case-insensitive `LIKE` on the title with `%`, `_` and `\` escaped. There are status and priority filters, a `dueFrom`/`dueTo` range (an inverted range gets a 400), and the due presets TODAY, OVERDUE, UPCOMING and NONE (I-20). Tasks sort by due date or creation order, and tasks with no due date always come last. `archived` defaults to false (BR-4). `archived=true` returns only archived tasks, which is what a Restore view needs.
- **Actions.** Completing, reopening, archiving and restoring each have their own endpoint, matching the user stories. `complete` and `reopen` are also the hooks BE-05 uses for BR-13. `DELETE` is permanent (I-4), so deleted tasks return 404 (BR-14).
- **"Today".** "Today" always comes from `SettingsService.today()`, so the `overdue` flag and the date presets agree.
- **For later phases.** `find(id)` and `listActive()` are there for the plan and dashboard phases.

## Files changed

- `backend/src/main/resources/db/migration/V2__tasks.sql`
- `backend/src/main/java/com/quickflow/task/{Task,TaskRepository,TaskDtos,TaskService,TaskController}.java`
- `backend/src/test/java/com/quickflow/task/TaskTest.java`
- `loops/backend-dev/verification/phase-02.sh`

## APIs / components

| Method | Path | Result |
|---|---|---|
| GET | /api/tasks?search&status&priority&due&dueFrom&dueTo&archived&sort&direction | 200 · 400 bad parameter |
| POST | /api/tasks | 201 · 400 |
| GET, PUT, DELETE | /api/tasks/{id} | 200 / 200 / 204 · 400 · 404 |
| POST | /api/tasks/{id}/complete, /reopen, /archive, /restore | 200 · 404 |

## Tests and verification

Trial 1 passed with 4 checks: build with unit tests, fresh start, the curl script, and Swagger documenting the list, complete and archive endpoints. The curl script's 52 assertions cover:

- **Create:** creation with trimming and defaults; titles of 200 characters accepted and 201 rejected; description over 2000; missing or blank title; bad status, priority and date values (the error lists the allowed values).
- **Update:** update, including validation and 404.
- **Complete and reopen:** `completedAt` and `overdue` flip correctly, and DONE can also be set through PUT.
- **Search and filters:** search with wildcard escaping; each filter on its own and combined; all four due presets; the date range and the inverted-range 400; a bad query parameter.
- **Sorting:** both sort directions, with undated tasks last.
- **Archive and delete:** archive hides a task, the archived view shows it, restore brings it back; delete gives 404 afterwards and on a second delete.

Unit tests (`TaskTest`) cover the `completedAt` transitions and the overdue rule, including the done and archived cases.

## Problems found and fixes

None.

## Final status

Done. Verified on trial 1.
