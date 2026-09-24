# frontend-dev — Loop instructions

Reusable loop that plans, implements, documents and verifies a frontend against a backend API. It is
project-agnostic: screens and stack come from the inputs.

## Purpose
Build the UI one feature at a time. A feature is done only when the **Playwright MCP server** has
driven it in a real browser against the running application (frontend and backend both up) and it
passed.

## Inputs
- `PRD.md` + the backend Swagger/OpenAPI (`/v3/api-docs` of the running backend), **or** a single user story + the API specification
- Existing state in `state/` and existing code in `frontend/` (used to resume or extend)
- `loops/backend-dev/state/`, for cross-loop dependencies

## Outputs
Same layout as backend-dev: `task.md`, `progress.md`, `state/`, `plan.json`,
`outputs/phase-NN-<name>.md`, `outputs/evidence/` (screenshots, Playwright notes), plus the code in `frontend/`.

## Preconditions
- Node.js and npm.
- The MCP servers in `.mcp.json`. All of them are headless with an isolated profile, so none of them opens your browser:
  - `playwright`: user scenarios, run through `playwright-verify.sh`. It needs the `claude` CLI on PATH.
  - `chrome-devtools`: Lighthouse, device/colour-scheme emulation, computed styles and performance traces. `ux-audit.py` uses it.
  - `context7`: up-to-date library docs. Look APIs up here instead of recalling them.
- The backend phases this feature needs are `done`. `loop.py` checks this through `ext:backend-dev/<ID>` dependencies.

## Process

**1. Initialise**
`python3 loops/_lib/loop.py init frontend-dev --input <PRD.md|story.md> --mode <prd|story>`

**2. Analyse and plan**
- Read the UX requirements: pages, navigation, forms, validation, empty/loading/error states, notifications, responsiveness.
- Read the OpenAPI spec and map each screen to the endpoints it uses. If a screen needs an endpoint that doesn't exist, that's a gap: record it and hand it back to backend-dev. Never fake data.
- Pick the stack (follow the repo if it has one) and record it in `docs/architecture.md`.
- Write `loops/frontend-dev/plan.json`. Phase 1 is the app shell: routing, navigation, API client, shared UI states. Then one phase per page/feature, each depending on its backend phase (e.g. `"dependsOn": ["FE-01", "ext:backend-dev/BE-02"]`). The last phase is an end-to-end journey.
- Plan the UI/UX work as its own phases, and don't leave it as polish at the end:
  - an **audit + design system** phase once the core pages exist. Its baseline is `ux-audit.py` plus screenshots at mobile and desktop width, and it produces tokens and shared components. The restyle must not change behaviour: the earlier scenarios have to pass unchanged.
  - an **improvements** phase that fixes the ranked findings for accessibility, responsive layout and feedback.
  - a **screen sizes** phase that designs each size class (phone, large phone, tablet, laptop, wide) and checks it with the `screenshots.sh` matrix (`SIZES=...`).
  - a **page transitions** phase: route transitions, prefetching from navigation, focus and title on navigation, reduced motion, and a DevTools performance trace.
  - pages built after these phases use the design system from the start.
  - the final phase adds the `ux-audit.py` gate for every page.
  - write the plan and its findings to `docs/ui-ux-plan.md`.
- `python3 loops/_lib/loop.py plan frontend-dev loops/frontend-dev/plan.json`

**3. Run every phase in this cycle**
1. `loop.py next frontend-dev`, then `loop.py start frontend-dev <ID>`.
2. Define the scope, acceptance criteria, screens/components and API calls in the phase output.
3. Implement the UI, state management, validation, and loading/error/empty states, plus responsive layout and accessibility (labels, roles, keyboard access).
4. Build and type-check, then run the app and note its URL.
5. Write the browser scenario `loops/frontend-dev/verification/phase-NN.md`: numbered steps a user would take, each with the result you expect to see. Cover navigation, forms and validation, data from the API, success, error and empty states, and dialogs. Mark the key steps `[screenshot]`.
6. Verify. One `verify` call counts as one trial:
   ```
   python3 loops/_lib/loop.py verify frontend-dev <ID> \
     --check "build=cd frontend && npm run build && npx vitest run" \
     --check "fresh=bash loops/frontend-dev/verification/test-env.sh fresh" \
     --check "seed=API=http://localhost:8090 bash loops/frontend-dev/verification/phase-NN-seed.sh" \
     --check "playwright=bash loops/_lib/playwright-verify.sh loops/frontend-dev/verification/phase-NN.md http://localhost:5180"
   ```
   Browser checks run against an **isolated copy** of the app from `verification/test-env.sh`: the UI on :5180 and an in-memory backend on :8090, with CORS set for :5180. The copy you use on :5173/:8080 is never reset, and an open tab of yours can't interfere with a check, for example by acknowledging a test plan's start notification first. Seed scripts read `API`. `regress.sh` uses the same environment.
   `playwright-verify.sh` runs the scenario through the Playwright MCP server in a separate headless session. It uses its own browser profile and never touches yours. The session has to end with a machine-readable verdict: the script exits 0 only if every step passed, saves screenshots to `outputs/evidence/`, and records the child session's ID in `execution-tracking.csv`.
   UI/UX phases add the Lighthouse gate, plus regression runs of earlier scenarios:
   ```
     --check "ux=python3 loops/_lib/ux-audit.py --pages /tasks,/habits --out loops/frontend-dev/outputs/evidence/ux-FE-NN"
     --check "regress-02=bash loops/_lib/playwright-verify.sh loops/frontend-dev/verification/phase-02.md"
   ```
   `ux-audit.py` drives chrome-devtools-mcp directly, with no LLM involved. It runs Lighthouse on every page, on mobile and desktop, and exits 0 only if accessibility ≥ 95, best practices ≥ 95, SEO ≥ 90 and CLS ≤ 0.1 (all can be changed with `--min`/`--max-cls`). The reports are kept in `--out`.
7. On FAIL: investigate, fix, rebuild or restart, then run Playwright again. On PASS: complete the output, tick the tasks, and run `loop.py finish frontend-dev <ID>`.

## Testing
Build success, type checks and unit tests are never enough on their own; Playwright MCP is required for every phase. Unit tests are optional and belong on non-trivial logic.

## State, retries and the stop condition
Identical to backend-dev. A phase stops when it is verified or after 3 failed trials; then it is blocked and its dependants are marked `blocked_by_dependency`. Resume by re-running the loop.

## Invocation
| Goal | Command |
|---|---|
| Full PRD | `loops/run.sh frontend-dev --input PRD.md` |
| One user story | `loops/run.sh frontend-dev --input story.md --mode story` |
| One phase | `loops/run.sh frontend-dev --input PRD.md --phase FE-03` |
| Resume | `loops/run.sh frontend-dev --resume` |
| Interactive | in Claude Code: *"Run the frontend-dev loop on PRD.md"* |
