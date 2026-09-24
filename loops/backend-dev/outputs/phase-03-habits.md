# BE-03 Habits

## Requirements covered

- FR-03
- FR-04
- BR-6
- BR-7
- US-HAB-1
- US-HAB-2
- US-HAB-3
- US-HAB-4
- US-HAB-5
- I-12
- I-13

## Tasks

- T1 Habit and completion models, unique habit/date
- T2 CRUD, activate/deactivate
- T3 Complete/undo for a date, duplicate prevention
- T4 Progress: streak and current period
- T5 Unit tests for streak rules
- T6 Verify with curl
- T7 Document phase

## Implementation

- **Model.** `Habit` has a name (max 150, BR-6), a description, a DAILY/WEEKLY frequency, and an active flag. `HabitCompletion` records one date per row. `UNIQUE (habit_id, completion_date)` enforces BR-7 at the database level, and the service returns a readable 409 before the database ever has to reject a row. Deleting a habit cascades to its completions.
- **Completing.** A completion is for a date, today by default. Future dates get a 400 and inactive habits get a 409 (I-13). Undo deletes the completion for that date.
- **Progress (US-HAB-4).** `HabitProgress` is a pure function of the completion dates and today. It reports `completedToday`, `completedThisPeriod`, `currentStreak` and `totalCompletions`. For a daily habit the period is the day. For a weekly habit it is the ISO week, and any completion in that week counts (I-12). A streak stays alive until the current period has ended without a completion. The list endpoint loads every habit's completions in one query, so there is no per-habit query.
- **Hooks for plans.** `completeToday` and `uncompleteToday` are idempotent. BE-05 uses them for BR-13.

## Files changed

- `backend/src/main/resources/db/migration/V3__habits.sql`
- `backend/src/main/java/com/quickflow/habit/{Habit,HabitCompletion,HabitRepositories,HabitProgress,HabitDtos,HabitService,HabitController}.java`
- `backend/src/test/java/com/quickflow/habit/HabitProgressTest.java`
- `loops/backend-dev/verification/phase-03.sh`

## APIs / components

| Method | Path | Result |
|---|---|---|
| GET | /api/habits?active= | 200 Habit[] with progress |
| POST | /api/habits | 201 · 400 |
| GET, PUT, DELETE | /api/habits/{id} | 200 / 200 / 204 · 404 |
| POST | /api/habits/{id}/deactivate, /activate | 200 |
| GET, POST | /api/habits/{id}/completions | 200 list / 201 · 400 future date · 409 duplicate or inactive |
| DELETE | /api/habits/{id}/completions/{date} | 200 · 404 |

## Tests and verification

Trial 1 passed with 4 checks: build with unit tests, fresh start, the curl script, and Swagger documenting the completions and deactivate endpoints. The curl script has 36 assertions:

- **Create:** daily and weekly habits; name length at 150 and 151; missing name or frequency; bad frequency, with the allowed values listed.
- **Complete:** today; a duplicate for the same date gets 409 and only one record exists; a future date gets 400; an unknown habit gets 404.
- **Streaks:** backfilled dates build a 3-day streak; a gap doesn't extend it; undoing today keeps the streak alive; a second undo gets 404; a weekly habit counts as done this week.
- **Update and lifecycle:** update and its validation; deactivate, then completing gets 409; the active and inactive filters; reactivate.
- **Delete:** the habit and its completions return 404 afterwards.

Unit tests (`HabitProgressTest`) cover daily streaks, a streak surviving the current day, weekly ISO-week counting, and consecutive-week streaks.

## Problems found and fixes

None.

## Final status

Done. Verified on trial 1.
