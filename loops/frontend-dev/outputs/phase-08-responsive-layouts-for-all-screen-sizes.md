# FE-08 Responsive layouts for all screen sizes

## Requirements covered

- UX-SIZES

## Tasks

- T1 Breakpoint system as tokens: phone <480, large phone 480-759, tablet 760-1023, laptop 1024-1439, wide 1440+, plus fluid type and spacing with clamp()
- T2 Tablet layout: collapsible icon-rail sidebar, two-column grids; wide layout: wider content, three-column card grids, list rows with inline meta
- T3 Phones: dialogs become bottom sheets, toolbar filters collapse into a Filters sheet, landscape phones keep the tab bar usable
- T4 Reflow at 320 CSS px and 200% zoom (WCAG 1.4.10), long titles and numbers wrap without overflow
- T5 Verify: screenshot matrix (320, 390, 768, 1024, 1440, 1920), responsive scenario, FE-01..07 regression, ux-audit mobile + desktop
- T6 Document phase

## Implementation

- **Size classes as tokens (T1).** `tokens.css` documents the five classes: phone < 480, large phone 480–759, tablet 760–1023, laptop 1024–1439, wide ≥ 1440. `src/lib/media.ts` exports the same numbers (`BREAKPOINTS`, `PHONE_QUERY`) with a `useMediaQuery` hook built on `useSyncExternalStore`. CSS custom properties can't be used inside `@media`, so the rules in `index.css` repeat the literal widths, and a comment in each place points at the others.
  - Fluid tokens: `--text-xl` and `--text-2xl` scale with `clamp()` between 320 px and 1440 px, and `--page-gutter` runs from 16 to 32 px, so there are no jumps at the breakpoints.
  - `--content-max` grows from 1120 px to 1320 px on wide screens.
  - The phone breakpoint moved from `max-width: 760px` to `759.98px`, so that 760 px is a tablet, as the plan says.
- **Tablet: icon rail (T2).** From 760 to 1023 px the sidebar is a 72 px rail with icons only. Links keep their full `aria-label`, and the brand shows only its mark.
  - An "Expand navigation" button (`aria-expanded`, `aria-controls="main-nav"`) opens the full 232 px sidebar *over* the content, with a scrim, so the page doesn't reflow.
  - It closes on navigation, on Escape, or on a click on the scrim.
  - The rail scrolls vertically, so it also works on landscape phones (for example 844 × 390).
- **Wide screens.** The content column is centred in the space next to the sidebar, where it used to stick to the left with an empty right-hand side at 1920 px. Grids get a third column, and list rows put the title and badges on one line (the description drops to its own line).
- **Phones (T3).**
  - All dialogs become bottom sheets below 760 px: full width, docked to the bottom, rounded top, safe-area padding, a max height of 90dvh with internal scrolling, and a slide-up using the motion tokens, so none under reduced motion.
  - On Tasks, the four filter selects and "Show archived" move into a "Filter tasks" sheet behind a "Filters" button. The button shows the number of active filters, as in "Filters (2)". The list now starts about 120 px higher on a 320 px screen.
  - Below 480 px, row actions show icons only. `Button` now wraps its text in `.btn-label`, which is visually hidden on those screens but stays in the accessibility tree, so Edit, Archive and Delete keep their names.
  - Below 360 px, tab labels use `--text-3xs`, so "Dashboard" isn't cut off.
- **Reflow (T4).** Page, card and dialog headings, row titles and toast text all use `overflow-wrap: anywhere` with `min-width: 0`, so a 120-character title with no spaces wraps at 320 px. A 1280 px window at 200% zoom (640 CSS px) gets the phone layout, which meets WCAG 1.4.10.

## Files changed

- New: `frontend/src/lib/media.ts`
- `frontend/src/styles/tokens.css` (size-class notes, fluid type, `--page-gutter`, `--rail-width`, `--text-3xs`, wide `--content-max`)
- `frontend/src/index.css` (tablet rail, wide rows, bottom sheets, compact phone actions, reflow rules)
- `frontend/src/components/Layout.tsx` (rail toggle, scrim, closing on navigation and Escape)
- `frontend/src/components/ds.tsx` (`.btn-label`, and `chevronLeft`, `chevronRight` and `filter` icons)
- `frontend/src/pages/TasksPage.tsx` (Filters sheet on phones)
- `loops/frontend-dev/verification/phase-08.md`, `phase-08-seed.sh`
- `loops/_lib/loop.py` (`verify` reloads state before saving; see Problems)

## APIs / components

No API changes. New `useMediaQuery(query)`, `BREAKPOINTS` and `PHONE_QUERY` in `src/lib/media.ts`. Button labels are wrapped in `.btn-label`, which is how any container can hide button text visually while keeping it as the accessible name.

## Tests and verification

FE-08 passed on trial 2 (1 of 3 trials failed). One more run was stopped by hand because of an infrastructure failure and was **not** counted; it is described under Problems. Logs are in `outputs/evidence/FE-08-trial{1,2}-*.log`, and `FE-08-aborted-*.log` for the stopped run.

| Check | Trial 1 | Trial 2 |
|---|---|---|
| build | PASS: tsc, vite and 52 vitest tests | PASS |
| regression 01..07 (fresh DB each) | FAIL: phase-07 step 12, Save hidden behind the tab bar; 01–06 passed | **PASS**, 0 of 7 failed: 10, 14, 12, 12, 12, 9 and 12 checks |
| playwright `phase-08.md` | FAIL on 1 of 9: step 5, the rail expansion broke the layout | **PASS** 9 of 9 (session `019bcdbf-cf12-4699-b3ea-3d8756cd7880`) |
| ux-audit (5 pages, mobile + desktop) | PASS | **PASS**: 100 / 100 / 100 and CLS ≤ 0.003 |
| screenshot matrix | PASS | **PASS**: 36 screenshots, 6 pages × 320/390/768/1024/1440/1920 px, in `evidence/ux-FE-08-after/` (the before set is in `ux-FE-08-before/`) |

Scenario coverage, by size:
- 320 px: no horizontal scroll; the full "Dashboard" tab label; the Filters sheet with its active-filter count; the bottom-sheet Add Task dialog; a 120-character unbroken title.
- 844 × 390 landscape: the rail, and a dialog that fits.
- 768 px: the rail expands over the content without moving `main`, then closes on Escape and on navigation.
- 1024 px: the full sidebar.
- 1440 px: title and badges on one line.
- 1920 px: `main` is 1320 px and centred.
- 640 px (200% zoom): the phone layout.

## Problems found and fixes

- **`loop.py verify` overwrote newer state.** `verify` loaded the state, ran its checks for about 45 minutes, and then saved that old copy. That dropped the 11-phase re-plan made during FE-07 trial 1, and the note recorded then. So `next` and `start` began "FE-08 Dashboard page" from the stale plan.
  - The fix: `verify` now reloads the state after the checks and only then records the run.
  - Repair: FE-08 was reset to pending and its wrong output file removed, the 11-phase plan was re-applied (the coverage check passes), and the lost FE-07 note was re-recorded with an explanation. A tracking row records the repair.
- **The rail toggle showed at every size.** `.rail-toggle { display: none }` lost to the later `.btn { display: inline-flex }` rule. Both selectors now use `.btn.rail-toggle`. The screenshot matrix caught this before any trial ran.
- **Save was hidden behind the tab bar (trial 1, regression phase-07 step 12).** At 360 px, `scrollIntoView({block: 'nearest'})`, which is what keyboard focus does, left "Save settings" under the fixed tab bar, failing WCAG 2.4.11 (Focus Not Obscured). The fix adds `html { scroll-padding-bottom: tab bar + safe area + 16px }` on phones. A headless probe then measured the button's bottom at 668 px against the nav top at 675 px.
- **The tablet rail broke the layout (trial 1, phase-08 step 5).** When the rail expanded, the sidebar became `position: fixed` and left the grid, so `main` auto-placed into the 72 px first column. The fix pins `.content` to `grid-column: 2; grid-row: 1` on tablets. The probe measured `main` still at left 72 px and 696 px wide, with the rail at 232 px.
- **Infrastructure failure, not counted as a trial.** In the next run, regression phase-03's child session (`79ed0806…`) reported that the Playwright MCP server failed to connect (`CONNECT_TIMEOUT` after 30 s), so that scenario never ran; 01 and 02 had passed. I stopped that run by hand before `verify` recorded it, recorded what happened with `loop.py note`, and kept its logs.
  - The fix: `playwright-verify.sh` pins `@playwright/mcp@0.0.82`, warms it up with `--prefer-offline` before the child starts, and retries once only when the browser server never connected, that is, when no step passed and the output reports a connection failure.
  - A real step failure is never retried, and the infrastructure attempt is tracked in `execution-tracking.csv`.

## Final status

Done. It passed on trial 2 of 3 after 1 failed trial, which was fixed. There are designed layouts for phone, large phone, tablet (icon rail), laptop and wide screens, with fluid type and spacing, bottom sheets, and reflow at 320 px and 200% zoom. Lighthouse stays at 100.
