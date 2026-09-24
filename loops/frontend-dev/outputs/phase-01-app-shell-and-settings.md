# FE-01 App shell and settings

## Requirements covered

- UX-NAV
- UX-SET
- DoD-1
- NFR-6
- NFR-7

## Tasks

- T1 Choose stack and record it in docs/architecture.md
- T2 Project setup and API client from OpenAPI
- T3 Layout with persistent navigation to six pages
- T4 Shared loading, error, empty states and dialogs
- T5 Settings page
- T6 Verify with Playwright MCP
- T7 Document phase

## Implementation

Stack: React 19, TypeScript 5.9 (strict), Vite, React Router, TanStack Query, and API types generated from `backend/openapi.json`. The reasons are in `docs/architecture.md`.

- **API client** (`src/api/client.ts`). A `fetch` wrapper turns problem+json responses into an `ApiError` carrying per-field messages, so forms can show server validation next to the right input. A network failure becomes a readable "Cannot reach the server" error.
- **Shell** (`Layout.tsx`). A persistent sidebar links to all six pages, with the active page highlighted. Below 760 px it becomes a horizontally scrollable top bar. `/` redirects to the default view chosen in Settings.
- **Shared UI** (`ui.tsx`). Loading, error (with retry) and empty states; a modal `Dialog` built on native `<dialog>`, which handles focus and Escape; `Field` with inline errors; a toast system with `aria-live`.
- **Settings page.** Profile (display name, optional email) and preferences (timezone, default view, plan-start notifications). It checks the required name before sending and shows the server's field errors (e.g. email format) inline.
- **Other pages.** Dashboard, Tasks, Habits, Learning and Plans are headings for now, so navigation is complete (DoD-1). Each gets built in its own phase.

## Files changed

- `frontend/` scaffold: `package.json`, `vite.config.ts` (dev proxy /api → :8080), `tsconfig.app.json` (strict), `index.html`, `public/favicon.svg`
- `frontend/src/api/{client.ts,schema.d.ts}`
- `frontend/src/components/{Layout,ui}.tsx`, `frontend/src/{App,main}.tsx`, `frontend/src/index.css`
- `frontend/src/pages/{Settings,Dashboard,Tasks,Habits,Learning,Plans}Page.tsx`
- `docs/architecture.md` (frontend section)
- `loops/frontend-dev/verification/phase-01.md`, `loops/_lib/playwright-verify.sh`, `.mcp.json`

## APIs / components

Uses `GET /api/settings` and `PUT /api/settings`. Components: `Layout`, `Dialog`, `Field`, `FormError`, `Loading`, `ErrorState`, `EmptyState`, `ToastProvider`/`useToast`, `SettingsPage`.

## Tests and verification

Trial 1 passed with 2 checks: `npm run build` (type-check and bundle) and the Playwright MCP scenario `verification/phase-01.md`, run headless by `playwright-verify.sh` (child session `6219c9e2-8255-4e8b-b14a-2a3fa32dfb7c`). All 10 steps passed:

- `/` redirects to the dashboard;
- the navigation has exactly six links, and each opens the right route and heading;
- Settings shows the default values;
- a blank name gives an inline error and nothing is saved;
- an invalid email gives the server's error inline;
- a valid save shows "Settings saved", the values survive a reload, and `/` then opens the chosen default view (Todo Plans);
- at 390 px wide the navigation still works.

Screenshots: `outputs/evidence/phase-01/step1-dashboard.png`, `step5-display-name-error.png`, `step7-settings-saved.png`, `step10-mobile-nav.png`.

## Problems found and fixes

1. **npm registry timeouts** while installing packages: retried with longer fetch timeouts.
2. **openapi-typescript needs TypeScript 5,** and the Vite template ships TypeScript 6. I pinned TypeScript to ~5.9 instead of forcing the install.
3. **springdoc marks every response field optional.** The `Model<>` helper treats response fields as present; recorded in `docs/architecture.md`.
4. **`/favicon.ico` returned 404** (seen in the browser console); I added `public/favicon.svg`.
5. **Playwright was driving the user's own browser.** The Playwright MCP server loaded in this session wasn't headless, and it took over the user's browser. I moved verification to `loops/_lib/playwright-verify.sh`, which runs Playwright MCP headless with an isolated profile in a child session and returns the verdict as an exit code. I also added `--headless --isolated` to `.mcp.json`.
6. **Screenshots were saved in the repo root.** The child session saved PNGs relative to its working directory, so I moved them into `outputs/evidence/phase-01/` and the helper now runs the child from that folder. This changes only where evidence is saved, so I didn't re-run the scenario.

## Final status

Done. Verified on trial 1.
