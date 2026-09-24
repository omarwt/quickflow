# FE-05 Todo plans page

## Requirements covered

- UX-PLAN
- NFR-2
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

## Tasks

- T1 Plan builder picking existing items
- T2 Plan list grouped active/upcoming and completed
- T3 Live rest time and progress
- T4 Item toggles and remove
- T5 Start-time notification
- T6 Verify with Playwright MCP
- T7 Document phase

## Implementation

- **Plan builder** (US-PLAN-1, US-PLAN-2). A dialog with title, start and end date-times, estimated minutes and priority order. The items are picked from `GET /api/plans/sources`, which lists the existing tasks, habits and learning resources grouped by source. Nothing can be created from inside the builder, which follows I-12. Required fields and the rule that end must be after start (BR-11) are checked on the client. Server `errors[]` are mapped onto their fields with `ApiError.forField`.
- **Plan list** (UX-PLAN). The page has two groups. **Active and upcoming** keeps the server order (priority, then start). **Completed** is sorted by newest end first. The list refetches every 30 s so that changes the clock makes to a status appear without any user action.
- **PlanCard** (US-PLAN-3..6). It shows the status badge, time window, estimate, a progress bar with `N of M items done`, and a per-item done checkbox with a source badge. A `deleted` badge appears when the source item no longer exists. Toggling an item refreshes plans, tasks and habits, because a plan item can complete its source (BR-13).
- **Live rest time** (US-PLAN-4, NFR-2). The countdown ticks every second from the plan's `serverTime` plus the time the response was received, so the client clock is never trusted. When a start or end boundary passes, the card refetches once to get the new status from the server. Not-started plans show "Starts in …".
- **Start notification** (US-PLAN-7). `StartNotifier` is mounted in the layout. It polls `GET /api/plans/start-notifications` every 15 s. For each plan it shows an in-app info toast, plus a browser `Notification` when that is enabled and allowed, and then acknowledges the plan with `POST /api/plans/{id}/start-notification/ack`. Because the server stores the acknowledgement, a plan notifies once, including after a reload or when it started while the app was closed. The `notificationsEnabled` setting turns off the visible part.
- **Remove** (US-PLAN-8) asks for confirmation and says that the source items are kept.
- The component is shared: `PlanCard` has a `compact` mode that hides the item list, so the dashboard (FE-06) can reuse it.

## Files changed

- `frontend/src/pages/PlansPage.tsx`
- `frontend/src/components/PlanBuilder.tsx`, `PlanCard.tsx`, `StartNotifier.tsx`, `Layout.tsx` (mounts the notifier), `ui.tsx` (info toasts stay until dismissed)
- `frontend/src/lib/time.ts` + `time.test.ts` (formatRest, remainingSeconds, useNow)
- `frontend/src/index.css` (plan styles)
- `loops/frontend-dev/verification/phase-05.md`, `phase-05-seed.sh`

## APIs / components

Uses `GET /api/plans`, `GET /api/plans/sources`, `POST /api/plans`, `PATCH /api/plans/{id}/items/{itemId}`, `DELETE /api/plans/{id}`, `GET /api/plans/start-notifications`, `POST /api/plans/{id}/start-notification/ack`, and `GET /api/settings`. The new components are `PlanBuilder`, `PlanCard` (with the `compact` prop) and `StartNotifier`. The `time.ts` helpers are also new.

## Tests and verification

- `npm run build` (tsc strict + vite) passed, and `vitest` passed 4 tests for the rest-time formatting and the server-clock countdown.
- `phase-05-seed.sh` runs on a fresh backend. It creates the source items, a past plan ("Yesterday review") and a plan that starts 90 s later ("Soon").
- The headless Playwright scenario `verification/phase-05.md` has 12 steps. It covers the grouped list, the builder with its validation errors (required fields, end before start), creating "Deep work" from existing items, the live rest time, item toggles updating the progress and the status (Completed and back), unticking reopening the task on /tasks, the start notification, removing a plan, and persistence after a reload with no duplicate notification.
  - Trial 1: FAIL at step 10 (session `0859c15a-6012-43cb-82f5-28eb8b09ec21`).
  - Trial 2: **PASS 12/12** (session `6c639205-1ae8-450e-af4d-6bd3c341a63b`).
- Evidence: `outputs/evidence/FE-05-trial{1,2}-*.log`, and `outputs/evidence/phase-05/step1,4,7,10.png`.

## Problems found and fixes

- **The start notification was missed** in trial 1. Info toasts hid automatically after a few seconds, and the notification fired while the verifier was on another page, so it had gone before anyone could read it. That means a real user could miss it too. The fix is that info toasts, which are only used for plan start notifications, now stay until they are dismissed. Success and error toasts still hide after 4 s. This was recorded with `loop.py note`, and trial 2 passed.
- **Nested OpenAPI types are optional.** springdoc marks the nested fields as optional, so `plan.items` is cast to `PlanItem[]` in the same way as in earlier phases (see docs/architecture.md).

## Final status

Done. It passed on trial 2 of 3, after 1 failed trial that was fixed. All of US-PLAN-1..10 are covered on the UI side.
