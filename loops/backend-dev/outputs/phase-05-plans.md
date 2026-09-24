# BE-05 Plans

## Requirements covered

- FR-07
- FR-08
- BR-10
- BR-11
- BR-12
- BR-13
- NFR-4
- NFR-8
- TR-1
- TR-2
- US-PLAN-1
- US-PLAN-2
- US-PLAN-3
- US-PLAN-4
- US-PLAN-5
- US-PLAN-6
- US-PLAN-7
- US-PLAN-8
- US-PLAN-9
- US-PLAN-10
- I-5
- I-6
- I-7
- I-8
- I-9
- I-10
- I-11
- I-18
- I-19

## Tasks

- T1 Plan and plan-item models
- T2 Create from existing items with validation
- T3 Status, progress and rest-time rules
- T4 Item toggle with BR-13 propagation
- T5 Remove, history, start notifications
- T6 Unit tests for plan lifecycle
- T7 Verify with curl
- T8 Document phase

## Implementation

- **Model.** `Plan` stores the title, `estimatedMinutes` (whole minutes, 1–100,000, I-10), the start and end instants, `priorityOrder` (1 = highest, I-11), status, `createdAt` and `startNotifiedAt`. `Plan.Item` records `sourceType` (TASK / HABIT / LEARNING_RESOURCE), `sourceId`, a title snapshot, and its own `done` flag. `CHECK (end_at > start_at)` backs up BR-11, and `UNIQUE (plan_id, source_type, source_id)` stops the same source being added twice.
- **Creating a plan (BR-10, I-18).** The plan needs at least one item. Each item must resolve to a non-archived task, an active habit, or a learning card; otherwise it gets a 400 on `items[i]`. `GET /api/plans/sources` returns exactly the selectable items for the builder.
- **Rules in `PlanPolicy` (pure, NFR-7).**
  - Status: before start → NOT_STARTED; all items done, or the end time reached → COMPLETED; otherwise IN_PROGRESS (I-7).
  - Progress: done ÷ total, rounded.
  - Rest time: seconds until the end, only while IN_PROGRESS, otherwise null (BR-12, I-8).
  - The status is recomputed and stored on every read, so it comes out the same after a restart (NFR-4). Responses include `serverTime` so the client can count down against the server clock.
- **BR-13 (I-6), handled in `setItemDone` only (NFR-8).**
  - A task item marked done sets the task to DONE; undone sets it back to TODO.
  - A habit item records or removes today's completion, idempotently.
  - A learning item changes only the plan.
  - Nothing is propagated when the source has been deleted.
- **Deleted sources (I-5).** The item keeps its title snapshot, is reported with `sourceAvailable=false`, and still counts toward progress.
- **Start notification (US-PLAN-7, I-9).** `GET /api/plans/start-notifications` lists plans that are in progress and haven't been acknowledged yet. `POST .../start-notification/ack` stamps `startNotifiedAt`, so each plan notifies once, even if it started while the app was closed.
- **Grouping and history (US-PLAN-10).** `group=ACTIVE` returns not-started and in-progress plans, sorted by priority and then start time. `group=COMPLETED` is the history, latest end first, each plan with its completion %.
- **Editing.** Plans can't be edited after creation (I-19).

## Files changed

- `backend/src/main/resources/db/migration/V5__plans.sql`
- `backend/src/main/java/com/quickflow/plan/{Plan,PlanPolicy,PlanRepository,PlanDtos,PlanService,PlanController}.java`
- `backend/src/test/java/com/quickflow/plan/PlanPolicyTest.java`
- `loops/backend-dev/verification/phase-05.sh`

## APIs / components

| Method | Path | Result |
|---|---|---|
| GET | /api/plans?group=ACTIVE\|COMPLETED\|ALL | 200 Plan[] |
| POST | /api/plans | 201 · 400 |
| GET, DELETE | /api/plans/{id} | 200 / 204 · 404 |
| PATCH | /api/plans/{id}/items/{itemId} | 200 · 400 · 404 · 409 inactive habit |
| GET | /api/plans/start-notifications | 200 Plan[] |
| POST | /api/plans/{id}/start-notification/ack | 200 · 409 not started |
| GET | /api/plans/sources | 200 {tasks, habits, learningResources} |

## Tests and verification

Trial 1 passed with 4 checks: build with unit tests, fresh start, the curl script, and Swagger documenting create, item PATCH and start-notifications. The curl script has 44 assertions and uses real time windows (past, current, future):

- **Sources:** archived tasks and inactive habits are excluded from the builder list.
- **Create:** a current plan is IN_PROGRESS with rest time counting to its end; a future plan is NOT_STARTED with no rest time; a past plan is COMPLETED at 0%. Rejected with 400: no items, an unknown source, an archived task, an inactive habit, a duplicate item, end before or equal to start, priority 0, duration 0, a bad source type.
- **BR-13:** progress goes 33 → 67 → 100%. The task item completes and then reopens the task. The habit item records and then removes today's completion. The learning item leaves the card unchanged. With all items done the plan is COMPLETED, and undoing an item puts it back IN_PROGRESS. An unknown item gets 404; a missing `done` gets 400.
- **Deleted source:** the item keeps its title snapshot and still counts.
- **Grouping and history:** active plans are ordered by priority; history shows the completion %.
- **Notifications:** listed once, acknowledged, then gone; acknowledging a future plan gets 409.
- **Remove:** removing a plan leaves its task in place.

Unit tests (`PlanPolicyTest`, TR-1/TR-2) cover the lifecycle at the exact start and end boundaries, all-done completion, NOT_STARTED winning before the start, rounded percentages, and rest time only while in progress.

## Problems found and fixes

None.

## Final status

Done. Verified on trial 1.
