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
- The Playwright MCP server is configured in `.mcp.json` and its tools (`mcp__playwright__*`) are available in the session.
- The backend phases this feature needs are `done`. `loop.py` checks this through `ext:backend-dev/<ID>` dependencies.

## Process

**1. Initialise**
`python3 loops/_lib/loop.py init frontend-dev --input <PRD.md|story.md> --mode <prd|story>`

**2. Analyse and plan**
- Read the UX requirements: pages, navigation, forms, validation, empty/loading/error states, notifications, responsiveness.
- Read the OpenAPI spec and map each screen to the endpoints it uses. If a screen needs an endpoint that doesn't exist, that's a gap: record it and hand it back to backend-dev. Never fake data.
- Pick the stack (follow the repo if it has one) and record it in `docs/architecture.md`.
- Write `loops/frontend-dev/plan.json`. Phase 1 is the app shell: routing, navigation, API client, shared UI states. Then one phase per page/feature, each depending on its backend phase (e.g. `"dependsOn": ["FE-01", "ext:backend-dev/BE-02"]`). The last phase is an end-to-end journey.
- `python3 loops/_lib/loop.py plan frontend-dev loops/frontend-dev/plan.json`

**3. Run every phase in this cycle**
1. `loop.py next frontend-dev`, then `loop.py start frontend-dev <ID>`.
2. Define the scope, acceptance criteria, screens/components and API calls in the phase output.
3. Implement the UI, state management, validation, and loading/error/empty states, plus responsive layout and accessibility (labels, roles, keyboard access).
4. Build and type-check, then run the app and note its URL.
5. Verify in the browser with the Playwright MCP tools. Navigate, click, fill and submit forms, and check validation, the API-driven data, success and error states, navigation, and dialogs. Save screenshots to `loops/frontend-dev/outputs/evidence/`.
6. Record the trial:
   ```
   python3 loops/_lib/loop.py verify frontend-dev <ID> \
     --check "build=cd frontend && npm run build" \
     --manual "playwright=pass|fail" --evidence loops/frontend-dev/outputs/evidence/<file>.png
   ```
   Pass `--manual playwright=pass` only if every step you performed in the browser behaved as expected. Write the steps and what you observed in the phase output.
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
