# FE-06 UI/UX audit and design system

## Requirements covered

- UX-DS
- UX-THEME

## Tasks

- T1 Baseline audit: Lighthouse (ux-audit.py) plus headless screenshots at 390 and 1280 px, findings ranked in docs/ui-ux-plan.md
- T2 Design tokens for colour, type scale, spacing, radius, elevation and motion, in light and dark
- T3 Shared components: Button variants and sizes, IconButton, Icon set, Badge, Card, Menu, Skeleton
- T4 Move existing pages onto tokens and components with no behaviour change
- T5 Verify: build, FE-01..05 Playwright regression, dark-theme scenario
- T6 Document phase

## Implementation

- **Baseline audit (T1).** `loops/_lib/ux-audit.py` ran Lighthouse through chrome-devtools-mcp on the five pages, on mobile and desktop, and `loops/_lib/screenshots.sh` took headless screenshots at 390 and 1280 px. Both ran before any change. Findings F1–F12 are ranked in `docs/ui-ux-plan.md`, and the evidence is in `outputs/evidence/ux-baseline/`.
  - The screenshots found three layout problems that Lighthouse missed (F10–F12). The 390 px page scrolled sideways because of the filter toolbar. An empty band sat under the mobile navigation. The habit card buttons had no gap between them.
- **Tokens (T2)** are in `src/styles/tokens.css`:
  - colours for surfaces, text, borders, accent, success, warning and danger, each with a `-soft` tint, plus toast and backdrop colours;
  - a type scale of 12/14/16/20/24/30 px with weights and line heights;
  - spacing on a 4 px grid;
  - radius at 6/10/999 px;
  - three shadows;
  - motion at 150/250 ms, set to 0 under `prefers-reduced-motion`;
  - control heights and layout widths.

  The dark theme redefines the colour and shadow tokens under `prefers-color-scheme: dark` (UX-THEME), and `color-scheme: light dark` makes the native controls follow it.
- **Contrast is tested, not assumed.** `src/styles/tokens.test.ts` reads the token file and checks 19 text pairs for ≥ 4.5:1 and 3 UI pairs for ≥ 3:1, in both themes (44 cases). On its first run it caught a dark-theme hover colour that failed.
- **Components (T3)** are in `src/components/ds.tsx`:
  - `Icon`: 22 inline Lucide paths, `aria-hidden`;
  - `Button`: primary, secondary, ghost, danger and danger-fill variants; sm and md sizes; an `icon`; and `pending`, which shows a spinner, disables the button and sets `aria-busy` while keeping the label;
  - `IconButton`, which requires `label` as its accessible name;
  - `Badge`, with neutral, accent, success, warning and danger tones;
  - `Card`;
  - `Menu`, which follows the WAI-ARIA menu-button pattern (arrow keys, Home/End, Escape returns focus, a click outside closes it);
  - `Skeleton`.

  Menu and Skeleton aren't used by any page yet. FE-07 adopts them, because using them now would change behaviour.
- **Pages moved onto the design system (T4) without behaviour changes:**
  - every raw `<button>` in pages and forms is now `Button` or `IconButton`, with the same accessible names;
  - every badge is a `Badge` with a meaningful tone: task status, high priority as warning, overdue as danger, plan status;
  - cards use `Card`;
  - the navigation and the main actions have icons;
  - toasts have an icon and a coloured edge for their kind;
  - `index.css` was rewritten on top of the tokens and has no colour literals.

  CSS-only fixes for F10–F12:
  - toolbar items can shrink and wrap;
  - the mobile shell uses `grid-template-rows: auto 1fr`;
  - `.row-actions` has a gap everywhere;
  - grids use `minmax(min(100%, …))`.

  F9: added a meta description, `theme-color` meta tags for both schemes, and `public/robots.txt`.

## Files changed

- New: `frontend/src/styles/tokens.css`, `frontend/src/styles/tokens.test.ts`, `frontend/src/components/ds.tsx`, `frontend/public/robots.txt`
- Rewritten: `frontend/src/index.css`
- Moved onto the components: `src/components/ui.tsx`, `Layout.tsx`, `PlanCard.tsx`, `TaskForm.tsx`, `HabitForm.tsx`, `LearningCardForm.tsx`, `PlanBuilder.tsx`, `src/pages/TasksPage.tsx`, `HabitsPage.tsx`, `LearningPage.tsx`, `PlansPage.tsx`, `SettingsPage.tsx`
- `frontend/index.html` (description, theme-color) and `frontend/vite.config.ts` (vitest reads `tokens.css` as text)
- Tooling: `loops/_lib/ux-audit.py`, `loops/_lib/screenshots.sh`, `loops/frontend-dev/verification/regress.sh`, `phase-06.md`, `phase-06-seed.sh`
- Docs: `docs/ui-ux-plan.md` (F10–F12 added)

## APIs / components

No API changes. The design-system API is `Icon`, `Button`, `IconButton`, `Badge` (with `Tone`), `Card`, `Menu` (with `MenuItem`) and `Skeleton` from `src/components/ds.tsx`, plus the CSS custom properties in `tokens.css`. Page code may only use these tokens and components.

## Tests and verification

Trial 1 **PASSED** (0 of 3 trials failed). Every check ran for real, and the logs are in `outputs/evidence/FE-06-trial1-*.log`.

| Check | Result |
|---|---|
| build | `tsc -b && vite build` passes. vitest ran 48 tests: 4 rest-time tests and 44 token-contrast cases. |
| regression | `regress.sh 01 02 03 04 05` re-ran the FE-01..05 scenarios **without editing them**, each on a fresh database: 10, 14, 12, 12 and 12 checks, all PASS, 0 of 5 failed. The child sessions were `f29adccb…`, `247285be…`, `89312842…`, `eb9bf45f…` and `777968e4…`. This shows the restyle didn't change any behaviour. |
| playwright | `phase-06.md` passed 9 of 9 checks (session `2ff0c33c-53c5-4705-b726-005c35d9e60c`). It covers light and dark computed colours on all five pages, the dark dialog with validation and Escape, the visible focus ring, the streak contrast colour, and no horizontal scroll at 390 px on `/tasks` and `/plans`. Screenshots are in `evidence/phase-06/`. |

**Lighthouse after FE-06.** This ran for information only; FE-07 is the phase that gates on it. `ux-audit.py` on the five pages, mobile and desktop, reported accessibility 100, best practices 100, SEO 100, and CLS between 0.000 and 0.003 on every page. The reports are in `evidence/ux-FE-06/`. The baseline had SEO 82, contrast failures on Habits and Plans, and mobile CLS up to 0.317. The only audit still failing is `llms-txt`, which is not part of any gated category.

## Problems found and fixes

- **The contrast test failed on its first run.** The dark `--color-accent-hover` (`#4c73e3`) gave white text a ratio under 4.5:1. The fix darkens it to `#3257c8`. This is the reason the test exists.
- **Vitest doesn't process CSS by default,** so `tokens.css?raw` came back empty. `test.css.include` in `vite.config.ts` now covers only that file.
- **The Chrome DevTools MCP server writes reports only inside client roots.** `ux-audit.py` now declares the `roots` capability and answers `roots/list` with the output directory.
- **`NodeListOf` isn't iterable with `lib: [ES2023, DOM]`.** `Menu` uses `Array.from` instead of widening the tsconfig.
- **Context7 wasn't used in this session.** The project MCP servers wait for approval in an interactive `claude` session. React 19 APIs used here (`useId`, refs, events) are stable, and the build type-checked them.
- **Mobile CLS is almost gone already.** It fell from 0.29–0.32 to ≤ 0.003, mostly from the mobile shell fix (F11). Skeleton loading (F1) stays in FE-07, because loading states still swap text for content on slow networks.

## Final status

Done. It passed on trial 1 of 3. Tokens, both themes and the shared components are in place, and the five existing pages use them with no change in behaviour. F2, F4, F8, F9, F10, F11 and F12 are fixed. F1, F3, F5 (menus), F6 and F7 are left for FE-07.
