# FE-02 Tasks page

## Requirements covered

- UX-TASK
- NFR-5
- US-TASK-1
- US-TASK-2
- US-TASK-3
- US-TASK-4
- US-TASK-5
- US-TASK-6
- US-TASK-7

## Tasks

- T1 Task list with search, filters, sort
- T2 Add/edit form with validation
- T3 Complete, archive, restore, delete
- T4 Empty state
- T5 Verify with Playwright MCP
- T6 Document phase

## Implementation

- **List and filters (FR-02, UX-TASK).** A search box (deferred, so typing isn't blocked by each query), status, priority and due-date filters (today / overdue / upcoming / no due date), a sort control (newest first or by due date), and a "Show archived" toggle that switches to the archived view where tasks can be restored (BR-4). Each filter change becomes query parameters on `GET /api/tasks`, and the backend does the filtering.
- **Task rows.** A completion checkbox that calls complete or reopen, badges for status, priority and due date, and an **Overdue** badge plus a red left edge when the backend reports `overdue` (US-TASK-7). Done tasks are struck through.
- **Add/edit form** (`TaskForm.tsx`, reused later by the dashboard's quick add). It checks the title (required, max 200) and description (max 2000) before sending, shows the server's field errors inline, and opens in the shared `Dialog`.
- **Actions.** Edit, Archive/Restore, and Delete with a `ConfirmDialog`, so nothing is deleted by accident. Every action shows a toast.
- **Empty states.** "No tasks yet" with an Add Task button (NFR-6), and a separate "No matching tasks" when filters hide everything.
- **Cross-page refresh.** `useRefresh()` invalidates the tasks, dashboard and plans queries after every change, so other pages never show stale data (FR-08).
- **Shared helpers.** `lib/format.ts` (dates and labels) and the `ConfirmDialog` component.

## Files changed

- `frontend/src/pages/TasksPage.tsx`, `frontend/src/components/TaskForm.tsx`
- `frontend/src/components/ui.tsx` (ConfirmDialog), `frontend/src/lib/{format,queries}.ts`, `frontend/src/index.css` (list/row styles)
- `loops/frontend-dev/verification/phase-02.md`

## APIs / components

Uses `GET /api/tasks` (search, status, priority, due, sort, direction, archived), `POST /api/tasks`, `PUT /api/tasks/{id}`, `POST /api/tasks/{id}/complete|reopen|archive|restore`, and `DELETE /api/tasks/{id}`. Components: `TasksPage`, `TaskForm`, `ConfirmDialog`.

## Tests and verification

Trial 1 passed with 2 checks: `npm run build`, and the headless Playwright MCP scenario `verification/phase-02.md` (child session `e8145d11-1d50-44a7-990d-771ac3d34bdb`). All 14 steps passed:

- the empty state appears;
- an empty title gives an inline error;
- three tasks are added with the right badges, and the one due yesterday shows Overdue;
- search, the priority, due and status filters each narrow the list;
- completing a task clears its Overdue badge and strikes it through;
- editing changes the title and status;
- archive hides a task, the archived view shows it, restore brings it back;
- delete asks for confirmation;
- the data survives a reload.

Screenshots: `outputs/evidence/phase-02/01-empty-state.png`, `05-three-tasks.png`, `09-paybills-done.png`, `13-after-delete.png`.

## Problems found and fixes

None.

## Final status

Done. Verified on trial 1.
