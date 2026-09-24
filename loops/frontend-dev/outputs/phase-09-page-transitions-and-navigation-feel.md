# FE-09 Page transitions and navigation feel

## Requirements covered

- UX-MOTION

## Tasks

- T1 Route transitions with the View Transitions API (React Router viewTransition), shell and navigation stay still, content cross-fades and slides
- T2 Prefetch a page's data when its nav link is hovered or focused, and keep previous data, so pages open without a loading flash
- T3 Focus and announcement on navigation: move focus to the page heading, per-page document.title, scroll to top; motion for dialogs, sheets, toasts and list add/remove
- T4 Respect prefers-reduced-motion (no movement, instant or fade only) and keep CLS 0 during navigation
- T5 Verify: transition scenario (titles, focus, no loading flash after prefetch, reduced motion), Chrome DevTools performance trace (INP under 200 ms, no layout shift), FE-01..07 regression
- T6 Document phase

## Implementation

- **Route transitions (T1).** `Layout` intercepts plain left-clicks on navigation links and runs `document.startViewTransition(() => flushSync(() => navigate(to)))`. React Router 7 documents its own `viewTransition` option only for data routers, and this app uses `<BrowserRouter>`.
  - `.sidebar` has `view-transition-name: shell-nav` with its animation turned off, so the navigation keeps still. `main` has `page`: the old page fades up and out in 150 ms, and the new one fades in and slides up in 250 ms. The root cross-fade is off.
  - Modified clicks (new tab, and so on), reduced motion, browsers without the API, and clicks on the current page fall back to a normal `NavLink` navigation.
- **Prefetching and no loading flash (T2).** `src/lib/pageQueries.ts` holds one `queryOptions` definition per page query, shared by the pages and by the navigation, so a prefetch fills exactly the key its page reads. A unit test pins this.
  - Nav links prefetch on `pointerenter`, `focus` and `touchstart`.
  - `staleTime` is 10 s, so hovering back and forth doesn't refetch, and a page opened within that time renders with its data instead of a skeleton.
  - Tasks uses `placeholderData: keepPreviousData`, so changing a filter or the search keeps the current rows on screen until the new ones arrive.
  - Filter parameters are built in one place (`taskParams`).
- **Orientation (T3).** On every route change (not on the first load, which keeps the browser's own focus), `usePageOrientation` sets `document.title` to "<Page> · QuickFlow", scrolls to the top, and moves focus to the page `h1` (given `tabIndex=-1`, with no focus ring, as a landing point). The next Tab continues into the page.
- **Small motions (T3).**
  - Dialogs fade and rise on desktop, and phones keep the sheet slide-up.
  - The backdrop fades.
  - Toasts slide in.
  - New rows and cards fade in by 4 px.
  - Removed rows disappear instantly: exit animations would need them to stay in the DOM after the data has gone, which isn't worth the complexity here.
- **Reduced motion (T4).** The motion tokens are 0 ms under `prefers-reduced-motion`. View Transitions are skipped altogether in JS, and a CSS guard sets every `::view-transition-*`, dialog, toast and item animation to `none`.

## Files changed

- New: `frontend/src/lib/pageQueries.ts`, `frontend/src/lib/pageQueries.test.ts`, `loops/_lib/nav-trace.py`
- `frontend/src/components/Layout.tsx` (transition navigation, prefetch handlers, `usePageOrientation`)
- `frontend/src/main.tsx` (`staleTime` 10 s)
- `frontend/src/index.css` (view-transition names and keyframes, motion, reduced-motion guard, phone stacking fix)
- `frontend/src/pages/TasksPage.tsx`, `HabitsPage.tsx`, `LearningPage.tsx`, `PlansPage.tsx`, `SettingsPage.tsx` (use `pageQueries`)
- `loops/frontend-dev/verification/phase-09.md`, `phase-09-seed.sh`

## APIs / components

No API changes.
- `pageQueries.{tasks, habits, dashboard, learning, plans, settings}`, `taskParams()`, `DEFAULT_TASK_FILTERS` and `prefetchRoute(queryClient, path)`.
- `nav-trace.py` is a new quality gate. It drives chrome-devtools-mcp directly, with no LLM: it clicks through the navigation during a performance trace and fails if the worst INP is over 200 ms or the worst CLS is over 0.1.

## Tests and verification

FE-09 passed on **trial 3 of 3**. Two trials failed, and two more runs were stopped by hand and not counted; both are explained below. Logs are in `outputs/evidence/FE-09-trial{1,2,3}-*.log` and `FE-09-aborted2-*.log`.

| Run | Result |
|---|---|
| trial 1 | FAIL, recorded with `--manual` after stopping at the first failure: regression phase-01 step 10, the tab bar couldn't be tapped |
| stopped run (not a trial) | regression 01–04 PASS. Stopped because FE-10 went onto 5173 at the user's request |
| trial 2 | FAIL, recorded with `--manual`: regression 01–04 PASS, phase-05 step 10 missed the plan-start message |
| development runs (not trials) | phase-05 12/12 (`868d24e0…`); phase-09 found the reload-focus bug, then passed 9/9 after the fix (`bb221c2f…`) |
| **trial 3** | **PASS**, all in the isolated test environment (UI :5180 → backend :8090) |

Trial 3 in detail:
- build: tsc, vite and 58 vitest tests.
- regression 01..08: 0 of 8 failed, with 10, 14, 12, 12, 12, 9, 12 and 9 checks.
- `phase-09.md`: 9/9 (session `53a71d7c-8ec0-4da7-b334-2bb4a0f73108`). It covers the titles, the view-transition names, the hover prefetch (0 → 1 request before the click), no skeleton after it, exactly one view transition with the sidebar element kept, focus on the new `h1`, scroll reset, keyboard navigation continuing into the page, sheet-up versus dialog-in, reduced motion with no transition and no animation, and a reload that doesn't move focus.
- `nav-trace.py`: 5 navigations, worst INP **110 ms** (the budget is 200), worst CLS **0.0**.

## Problems found and fixes

- **The tab bar couldn't be tapped on phones (trial 1).** `view-transition-name` makes `.sidebar` and `main` stacking contexts. The fixed tab bar inside `.sidebar` (z-index 25) was then confined to the sidebar's context, and `main`, which comes later in the DOM, painted over it. In regression phase-01 step 10, clicks on "Tasks" timed out because `main` intercepted them.
  - The fix gives `.sidebar` `position: relative; z-index: 25` on phones. A headless probe then found `elementFromPoint` at the centre of all six tab links hitting the link, on `/tasks` and on `/settings`.
  - Trial 1 was stopped after this first failure, since the remaining checks couldn't change the result, and recorded as a failed trial with `verify --manual` pointing at the evidence log.
- **INP went up with transitions.** The navigation trace measured a worst INP of 39 ms before FE-09 and 108 ms after it. The View Transition snapshots the old page and renders the new one synchronously (`flushSync`) before the next paint. That is inside the 200 ms budget, so I kept it, and the gate will catch any regression.
- **The plan-start message was missed (trial 2).** Toasts now close on their own, at the user's request, so a plan that started while the checker was on another page was gone when it came back. The user's own tab on the shared 5173/8080 servers could also acknowledge a test plan first. The fixes:
  - a "Just started" badge on plan cards for 10 minutes;
  - FE-05 step 10 now creates its own plan starting at the next full minute and watches `/plans`;
  - an isolated test environment (`test-env.sh`: UI :5180 → an in-memory backend :8090, with CORS for :5180), which `regress.sh` and every browser check use. `backend/run.sh` keeps per-port pid and log files.
- **Toasts looked permanent.** `StartNotifier` dropped a plan from its "shown" set when acknowledging it failed, which happened on the 5174 preview because of CORS, so it showed the same toast every 15 s, and the duplicate check restarted its timer. Acknowledgements are now retried without showing the toast again, and the hover pause applies only to a mouse.
- **Focus moved on reload (development run).** React StrictMode runs effects twice, which used up the "first load" flag. `usePageOrientation` now compares with the previous path, which skips the first render, the StrictMode re-run and the `/` redirect.
- **Stopping runs.** Twice a run was stopped by hand: once when the user asked for FE-10 on 5173, and once after trial 2's first failure, which was then recorded as a failed trial. Every stop is recorded with `loop.py note` and its logs are kept.

## Final status

Done, on trial 3 of 3. Page changes keep the shell still and animate only the content. Data is prefetched from the navigation, so pages open without a loading flash. Focus, title and scroll are handled on navigation, motion respects reduced-motion settings, and the INP and CLS budgets hold (110 ms, 0.0).
