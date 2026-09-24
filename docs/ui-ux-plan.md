# UI/UX improvement plan

The first five frontend phases (FE-01..FE-05) made every feature work and verified it in a browser.
They didn't set out to make the app look or feel good, and nothing measured that. This plan adds
that work as normal frontend-dev phases, so it has the same state, 3-trial limit and verification
gate as every other phase. The matching requirement IDs (UX-DS, UX-A11Y, UX-RESP, UX-FEED,
UX-THEME, UX-AUDIT) are in the OR-01 analysis.

## Where we start: baseline audit

`loops/_lib/ux-audit.py` ran Lighthouse through the Chrome DevTools MCP server on the five existing
pages, on mobile and desktop, before any change. The reports are in
`loops/frontend-dev/outputs/evidence/ux-baseline/`.

| Page | Accessibility (mobile / desktop) | Best practices | SEO | CLS mobile | Failed audits |
|---|---|---|---|---|---|
| Tasks | 100 / 100 | 100 | 82 | 0.095 | meta-description, robots-txt |
| Habits | 95 / 95 | 100 | 82 | 0.046 | **color-contrast** (streak text `#b86e00` on white, 3.98:1) |
| Learning | 100 / 100 | 100 | 82 | 0.040 | meta-description, robots-txt |
| Todo Plans | 96 / 96 | 100 | 82 | **0.317** | **color-contrast** (`badge success` `#1f8a4c` on `#f6f7f9`, 4.08:1) |
| Settings | 100 / 100 | 100 | 82 | **0.294** | meta-description, robots-txt |

After FE-06, the same audit reports accessibility, best practices and SEO at 100 on all five pages, with
mobile CLS ≤ 0.003 (`evidence/ux-FE-06/`).

On top of Lighthouse, the FE-05 screenshots, the baseline screenshots at 390 and 1280 px
(`ux-baseline/screens/`, from `loops/_lib/screenshots.sh`), and a review of `index.css` and `Layout.tsx` show:

| # | Finding | Severity | Fixed in |
|---|---|---|---|
| F1 | Loading text is replaced by content of a different height, so mobile CLS reaches 0.32 | high | FE-07 (skeletons) |
| F2 | Success and warning colours fail 4.5:1 on small text | high | FE-06 tokens, FE-07 |
| F3 | Below 760 px the six nav links become a horizontally scrolling row, and some pages are hidden off-screen | high | FE-07 |
| F4 | Colours and sizes are written by hand in the CSS (about 150 lines, 10 variables). There is no type scale, spacing scale or elevation, and headings, badges and buttons don't follow a shared rhythm | medium | FE-06 |
| F5 | There are no icons. Every action is a full text button, so each card ends with a large "Remove" button that looks as important as the main content | medium | FE-06 (IconButton, Menu) |
| F6 | Toggles wait for the server before they change. Some submit buttons don't show a pending state | medium | FE-07 |
| F7 | Copy: "0 of 1 items done" (plurals), raw dates where "today" or "in 2 h" would read better | low | FE-07 |
| F8 | No dark theme, although most systems ask for one | low | FE-06 |
| F9 | No meta description or robots.txt (SEO 82). Small, but it keeps the gate green | low | FE-06 |
| F10 | At 390 px the task filter toolbar is wider than the screen, so the whole page scrolls sideways (baseline screenshot `tasks-390.png`) | high | FE-06 (layout primitives) |
| F11 | On mobile, the shell grid stretches the navigation row and leaves an empty band above the content | medium | FE-06 |
| F12 | Action buttons on habit cards touch each other, because `.row-actions` only had a gap inside list rows | low | FE-06 |

## Design direction

- **Calm and dense.** This is a productivity tool people open many times a day. Content comes first,
  with one accent colour, and status is shown by colour *plus* text or an icon, never by colour alone.
- **Tokens first.** Everything is a CSS custom property on `:root`, redefined for dark mode under
  `prefers-color-scheme`. That gives:
  - a type scale of 12/14/16/20/24/30 px,
  - spacing on a 4 px grid,
  - radius at 6/10/999 px,
  - three elevation levels,
  - motion at 150/250 ms, turned off under `prefers-reduced-motion`.
- **Components.** Pages use these and never style raw elements:
  - Button: `primary`, `secondary`, `ghost` and `danger` variants, `sm` and `md` sizes, and a `pending` state;
  - IconButton, which always has an `aria-label`;
  - Icon: inline SVGs, with no icon-font dependency;
  - Badge, which uses tinted backgrounds that pass contrast;
  - Card;
  - Menu, for secondary actions such as Edit, Archive and Remove;
  - Skeleton, which matches the shape of the content it stands in for.
- **No new UI framework.** The app is small, and plain CSS with tokens keeps the bundle and the
  learning curve small. This follows the existing decision in `docs/architecture.md`.

## Phases

| Phase | Goal | Depends on | Verification gate |
|---|---|---|---|
| **FE-06 UI/UX audit and design system** | tokens (light + dark), shared components, existing pages moved onto them with **no behaviour change**, meta description/robots.txt | FE-02..05 | build + unit tests; FE-01..05 Playwright scenarios re-run unchanged (regression); dark-theme scenario |
| **FE-07 UI/UX improvements to existing pages** | fix F1–F3, F5–F7: contrast, focus, skip link, mobile nav (bottom bar ≤ 760 px), skeletons, pending/optimistic toggles, copy | FE-06 | build; UX scenario (keyboard-only run, 360 px width, dark theme); FE-01..05 regression; `ux-audit.py` on the five pages |
| **FE-08 Dashboard page** | the last PRD page, built directly on the design system | FE-07, BE-06 | Playwright scenario + `ux-audit.py --pages /dashboard` |
| **FE-09 End-to-end journey and UX acceptance** | TR-4 journey on a fresh DB, reload persistence, keyboard-only and 360 px runs | FE-08, BE-07 | Playwright journey + `ux-audit.py` on all six pages, mobile and desktop |

The Dashboard moved from FE-06 to FE-08, so it is built on the design system and not reworked
afterwards. FE-06 has to be behaviour-neutral: the earlier Playwright scenarios must pass without
edits, which proves the restyle didn't break a feature.

## Tools (MCP servers)

All the servers are configured in `.mcp.json`, and all run headless with an isolated profile, so none of them uses your browser.

| Server | Used for |
|---|---|
| `playwright` | user scenarios in `loops/frontend-dev/verification/*.md` via `loops/_lib/playwright-verify.sh`. It also runs the width and theme checks: `browser_resize`, and `browser_emulate_media` for dark mode |
| `chrome-devtools` | Lighthouse (`lighthouse_audit`) for the `ux-audit.py` gate; `emulate` (dark scheme, mobile, slow network); `get_css_styles` to check computed contrast/tokens; `performance_start_trace` for interaction timing (NFR-1) |
| `context7` | current docs for React 19, React Router 7 and TanStack Query 5 while building components, so the APIs aren't recalled from memory |

`ux-audit.py` connects to chrome-devtools-mcp as a plain MCP client and doesn't use an LLM, so its
scores come straight from Lighthouse's `report.json`.

## Acceptance (end of FE-09)

- `ux-audit.py` passes on all six pages, on mobile and desktop: accessibility ≥ 95, best practices ≥ 95, SEO ≥ 90, CLS ≤ 0.1.
- Every PRD journey can be done with the keyboard alone and at 360 px width, with no horizontal page scroll.
- Both themes meet WCAG 2.2 AA contrast.
- No colour or size literal is left in the page components, only tokens.
- The FE-01..05 scenarios and the vitest suite still pass.
