# BE-06 Dashboard

## Requirements covered

- FR-09
- TR-3
- US-DASH-1
- US-DASH-2
- US-DASH-3
- US-DASH-4
- US-DASH-5
- US-DASH-6
- I-16

## Tasks

- T1 Dashboard aggregate endpoint
- T2 Unit test for completion percentage
- T3 Verify with curl, cross-checking list endpoints
- T4 Document phase

## Implementation

`GET /api/dashboard` is a read-only roll-up built from the same service methods the list endpoints use, so its numbers can't disagree with the pages.

- **Tasks.** Non-archived tasks due today, overdue tasks, completed today (by `completedAt` in the user's timezone), total, done, and `completionPercent` = done ÷ non-archived tasks, rounded (I-16).
- **Habits.** Active habits with their progress (the today checklist), the active count, and how many are completed today.
- **Plans.** In-progress plans with rest time and progress, plus counts of not-started and completed plans. Because plan status is recomputed on read, the dashboard always shows current state (FR-08).
- **Learning.** Card counts by status, milestones done and total, and milestones completed in the last 7 days (I-15).

It also returns `displayName` for the greeting and `today`/`serverTime` for the UI clock. I added `SettingsService.zone()` so completion times can be turned into the user's local date.

## Files changed

- `backend/src/main/java/com/quickflow/dashboard/{DashboardDto,DashboardService,DashboardController}.java`
- `backend/src/main/java/com/quickflow/settings/SettingsService.java` (added `zone()`)
- `backend/src/test/java/com/quickflow/dashboard/DashboardServiceTest.java`
- `loops/backend-dev/verification/phase-06.sh`

## APIs / components

| Method | Path | Result |
|---|---|---|
| GET | /api/dashboard | 200 Dashboard {displayName, today, serverTime, tasks, habits, plans, learning} |

## Tests and verification

Trial 1 passed with 4 checks: build with unit tests, fresh start, the curl script, and Swagger documenting the dashboard. The curl script (13 assertions) first checks that an empty database gives all zeros. It then seeds tasks (due today, overdue, done, and archived-and-done), daily, weekly and inactive habits, learning cards with milestones, and a current plan and a future plan, and **cross-checks every section against the list endpoints (TR-3)**:

- due today and overdue match `?due=TODAY` and `?due=OVERDUE`;
- totals match `/api/tasks`, with the archived task excluded;
- the active habits and the completed-today count match `?active=true`;
- the plan counts, rest time and learning snapshot are correct.

Finally it marks a plan item done and confirms the dashboard shows it at once: plan progress goes to 50%, and task completion goes from 33% to 67% because the task item completed its task (BR-13). Unit test: `DashboardServiceTest` covers percentage rounding and the zero case.

## Problems found and fixes

None.

## Final status

Done. Verified on trial 1.
