# FE-03 Habits page

## Requirements covered

- UX-HAB
- US-HAB-1
- US-HAB-2
- US-HAB-3
- US-HAB-4
- US-HAB-5

## Tasks

- T1 Habit cards with toggle, frequency, streak
- T2 Add/edit form
- T3 Deactivate and remove
- T4 Empty state
- T5 Verify with Playwright MCP
- T6 Document phase

## Implementation

- **Habit cards (UX-HAB).** Each card shows the name, description, a Daily/Weekly label, a streak indicator ("3-day streak" or "2-week streak"), and for weekly habits whether this week is done. It also has a **Done today** checkbox (US-HAB-3, US-HAB-4). Inactive habits move to their own "Inactive" section, dimmed and without the checkbox.
- **Completion toggle** (`HabitToggle.tsx`, reused by the dashboard checklist). Ticking the box sends `POST /habits/{id}/completions`, and unticking sends `DELETE /habits/{id}/completions/{today}`. The date "today" comes from the server's dashboard response, which uses the user's Settings timezone, rather than from the browser clock, so undo always targets the same day the backend recorded. The backend's duplicate rule (BR-7) stays authoritative, and a 409 would show as an error toast.
- **Add/edit form** (`HabitForm.tsx`). Name (required, max 150, checked before sending plus the server's errors), description, and a Daily/Weekly choice (US-HAB-2).
- **Actions.** Edit, Deactivate/Activate, and Remove behind a confirmation that warns the completion history goes too (US-HAB-5).
- **Empty state.** It offers Add Habit (NFR-6). Every change refreshes the habits, dashboard and plans data.

## Files changed

- `frontend/src/pages/HabitsPage.tsx`, `frontend/src/components/{HabitForm,HabitToggle}.tsx`
- `frontend/src/index.css` (habit card styles)
- `loops/frontend-dev/verification/phase-03.md`

## APIs / components

Uses `GET /api/habits`, `POST /api/habits`, `PUT /api/habits/{id}`, `POST /api/habits/{id}/activate|deactivate`, `DELETE /api/habits/{id}`, `POST /api/habits/{id}/completions`, `DELETE /api/habits/{id}/completions/{date}`, and `GET /api/dashboard` (for today's date). Components: `HabitsPage`, `HabitForm`, `HabitToggle`.

## Tests and verification

Trial 1 passed with 2 checks: `npm run build`, and the headless Playwright MCP scenario `verification/phase-03.md` (child session `40b91f13-bae0-4a50-b66d-e19667d392d8`). All 12 steps passed:

- the empty state appears;
- an empty name gives an inline error;
- a daily and a weekly habit are added;
- ticking Done today gives a 1-day streak, which survives a reload without duplicating;
- unticking resets the streak, and re-ticking restores it;
- the weekly habit shows a 1-week streak and "Done this week";
- renaming works;
- deactivating moves the habit to Inactive with no checkbox, and activating brings it back;
- remove asks for confirmation.

Screenshots: `outputs/evidence/phase-03/step1-empty.png`, `step4-two-habits.png`, `step10-inactive.png`, `step12-removed.png`.

## Problems found and fixes

None.

## Final status

Done. Verified on trial 1.
