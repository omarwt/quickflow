# FE-07 UI/UX improvements to existing pages

## Requirements covered

- UX-A11Y
- UX-RESP
- UX-FEED

## Tasks

- T1 Fix contrast and focus findings, add skip link and landmarks
- T2 Mobile navigation without horizontal scroll, layouts from 360 px, touch targets
- T3 Skeleton loading without layout shift, pending buttons, immediate toggle feedback
- T4 Copy fixes: plurals, relative dates, clearer empty states and confirmations
- T5 Verify: build, UX scenario (keyboard-only, 360 px, dark), FE-01..05 regression, ux-audit on the five pages
- T6 Document phase

## Implementation

- **Keyboard and landmarks (UX-A11Y, T1).**
  - A "Skip to content" link comes first in the tab order. It is hidden until focused and moves focus to `<main id="main" tabIndex=-1>`.
  - The navigation keeps `aria-label="Main"`, and React Router sets `aria-current="page"` on the active link.
  - Focus rings come from the FE-06 `--focus-ring` token on every `:focus-visible`.
  - Contrast was already at 100 after FE-06 (F2).
- **Mobile navigation (UX-RESP, F3, T2).** Below 760 px the sidebar becomes a slim brand bar at the top plus a fixed tab bar at the bottom with all six pages. Each tab is an icon plus a short label ("Learning", "Plans") in equal columns, so nothing scrolls sideways even at 360 px.
  - Each link keeps its full name as `aria-label`. The visible short label is contained in that name, which meets WCAG 2.5.3 Label in Name.
  - Tabs are 56 px tall (`--tabbar-height`).
  - Content and toasts are padded above the bar, and the bar respects `safe-area-inset-bottom`.
  - Page headings drop to `--text-xl` on mobile.
- **Touch targets.** Checkboxes grew from 18 to 20 px. Together with the label or spacing around them, and small buttons at 32 px, every target meets WCAG 2.5.8 (24 px).
- **Feedback (UX-FEED, F1/F6, T3).**
  - `Loading` has `rows`, `cards` and `form` variants built from `Skeleton`, shaped like the content that replaces them. Screen readers get a `role=status` with a visually hidden "Loading…".
  - The Tasks, Habits, Learning, Plans and Settings pages use these variants.
  - Toggles are now optimistic: the task checkbox, habit "Done today", plan items and milestones switch at once and are no longer disabled or greyed while saving. Each one's mutation returns its refetch, so it stays pending until the list has the server's state and never flips back for a moment. A second click while pending is ignored, and `aria-busy` is set.
  - Row actions show a spinner: Archive/Restore on tasks, Deactivate/Activate on habits, and Add milestone/Add note.
- **Copy (F7, T4).**
  - Plurals: "0 of 1 item done", "1 of 1 milestone done".
  - Due badges read "Due today/tomorrow/yesterday", computed in the **Settings timezone** through `useToday()`, not the browser clock. "Due today" is highlighted.
  - Plan windows on a single day read "Today, 09:00 AM → 10:00 AM".
  - The filtered-empty state on Tasks explains the problem and offers "Clear filters".

## Files changed

- `frontend/src/components/Layout.tsx` (skip link, main landmark, short and full nav labels)
- `frontend/src/components/ui.tsx` (skeleton `Loading` variants)
- `frontend/src/index.css` and `styles/tokens.css` (tab bar, skip link, `sr-only`, skeleton layouts, 20 px checkboxes, `--text-2xs`, `--tabbar-height`)
- `frontend/src/lib/format.ts` + new `format.test.ts` (`plural`, `relativeDay`, `todayIn`, `formatWindow`)
- `frontend/src/lib/queries.ts` (`useToday`)
- `frontend/src/pages/TasksPage.tsx`, `HabitsPage.tsx`, `LearningPage.tsx`, `PlansPage.tsx`, `SettingsPage.tsx`
- `frontend/src/components/HabitToggle.tsx`, `PlanCard.tsx`
- `loops/frontend-dev/verification/phase-07.md`, `phase-07-seed.sh`
- Two expected texts in earlier scenarios changed (see Problems): `phase-02.md` step 3 and `phase-04.md` step 9
- `docs/ui-ux-plan.md` (the F5 decision)

## APIs / components

No API changes.
- `Loading` now takes `variant` and `count`.
- New helpers: `plural()`, `relativeDay()`, `todayIn()`, `formatWindow()` and `useToday()`.
- The navigation data has an optional `short` label.

## Tests and verification

FE-07 took two trials (1 of 3 failed). Every check ran for real, and the logs are in `outputs/evidence/FE-07-trial{1,2}-*.log`.

| Check | Trial 1 | Trial 2 |
|---|---|---|
| build | PASS: tsc, vite and 52 vitest tests (8 new ones for the copy helpers) | PASS |
| regression 01..05 (fresh DB each) | FAIL: phase-01 step 10 expected the old top navigation on mobile (session `97e2403a…`). 02–05 passed. | **PASS**, 0 of 5 failed: 10, 14, 12, 12 and 12 checks (sessions `c7fdaadd…`, `3200012d…`, `ed64ace1…`, `965e80b0…`, `41999e23…`) |
| playwright `phase-07.md` | FAIL on 2 of 12: step 2, dialog focus on Close; step 11, toast over the tab bar (session `c23a4806…`) | **PASS** 12 of 12 (session `38c48436-f4c3-402b-aa25-52d5f26a63b6`) |
| ux-audit (5 pages, mobile + desktop) | PASS | **PASS**: accessibility, best practices and SEO all 100; CLS ≤ 0.003 |

The phase-07 scenario covers:
- the skip link and focus on `main`;
- keyboard-only adding and completing of a task;
- keyboard-only opening of a card and ticking a milestone;
- "Due today";
- the filtered-empty state with "Clear filters";
- singular and plural copy;
- the "Today, … → …" plan window;
- at 360 px: no horizontal scroll, a bottom tab bar with all six full-name links, each 58.6 × 56 px;
- in dark mode, a toast above the tab bar and the Save button reachable above it.

Screenshots are in `evidence/phase-07/`.

## Problems found and fixes

- **Two earlier scenarios encoded the old copy.** `phase-04.md` step 9 expected "1 of 1 milestone**s** done", which is the plural bug F7, and `phase-02.md` step 3 expected "its due date", which is now "Due today". These are intended behaviour changes, so exactly these two expected texts were updated before the regression. No other step was touched.
- **F5 (text buttons at the same weight as content) wasn't moved into `Menu`.** The FE-06 styling already makes secondary actions quiet. Tucking frequent actions such as Edit and Archive into a menu would add a click to every use and change the tested flows. `Menu` is kept for the dashboard's quick-add in FE-10. This is recorded in `docs/ui-ux-plan.md`.
- **Optimistic toggles can flicker back.** If a mutation resolves before its refetch, the checkbox briefly shows the old state again. The fix returns the `invalidateQueries` promise from `onSuccess`, which TanStack Query v5 awaits, so the pending state covers the refetch.
- **A third scenario encoded the old layout (trial 1).** `phase-01.md` step 10 expected the mobile navigation "at the top of the page". The earlier search for affected scenarios only looked for changed copy. The fix updates that one expectation to the bottom tab bar and checks phase-01..05 for any other layout assumptions; there were none.
- **Dialog focus went to Close (trial 1, step 2).** `showModal()` focuses the first focusable element in the dialog, which overrode the form's `autoFocus`, so keyboard users started on "Close". The fix: `Dialog` wraps the content in `.dialog-body` and, straight after `showModal()`, focuses its first field. In confirmations that is the first button, Cancel, which is the safe default.
- **The toast covered the tab bar (trial 1, step 11), and the smaller mobile `h1` never applied.** Both mobile overrides sat above the base `.toasts` and `.page-head h1` rules, so the later base rules won the cascade. The fix moves them to a final `@media` block at the end of `index.css`. Toasts now span the width above the tab bar, including the safe-area inset.

## Final status

Done. It passed on trial 2 of 3, after 1 failed trial that was fixed. F1, F3, F6 and F7 are fixed. F5 is resolved by design, with `Menu` kept for FE-10. The five pages score 100 on every Lighthouse category, on mobile and desktop.
