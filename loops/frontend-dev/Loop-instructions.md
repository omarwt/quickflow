# frontend-dev — Loop instructions

A reusable loop that builds a frontend against a backend API, one feature at a time. Nothing here
is specific to one product: the screens and the stack come from the input.

## What "done" means

A phase is done only when the Playwright MCP server has driven the feature in a real browser,
against the running frontend and backend, and every step of the scenario passed. A green build,
type check or unit test run is never enough on its own.

## What you work with

| File or folder | What it is for |
| --- | --- |
| `PRD.md` plus the backend OpenAPI document, or a user story plus the API it needs | The input. |
| `task.md` | The phase plan and its checklist. You keep it up to date by hand. |
| `progress.md` | The history of each phase: when it ran, how many trials, what failed, what was fixed. |
| `outputs/phase-NN-<name>.md` | One write-up per phase. |
| `outputs/evidence/` | Logs, screenshots and audit reports of every verification run. |
| `verification/phase-NN.md` | The browser scenario that verifies a phase. |
| `verification/phase-NN-seed.sh` | Optional: data the scenario needs, created through the API. |
| `loops/backend-dev/task.md` | Tells you which backend phases are done. |
| `frontend/` | The code. |

You need Node.js and npm, the Claude Code CLI, and the MCP servers in `.mcp.json`. All of them
run headless with an isolated profile, so they never open your own browser:

- `playwright` drives the browser through the user scenarios.
- `chrome-devtools` runs Lighthouse, emulates devices and colour schemes, reads computed styles and records performance traces.
- `context7` gives up-to-date library documentation. Look APIs up there instead of recalling them.

## Step 1: read and plan

Skip this step when `task.md` already lists phases; then go straight to step 2.

1. Read the UX requirements: pages, navigation, forms, validation, empty, loading and error
   states, notifications and responsiveness.
2. Read the OpenAPI document and map each screen to the endpoints it uses. A screen that needs an
   endpoint that doesn't exist is a gap: record it and hand it back to backend-dev. Never fake data.
3. Pick the stack. Follow the repository if it already has one. Record the choice in `docs/architecture.md`.
4. Write the phases into `task.md`. The first phase is the app shell: routing, navigation, the API
   client and the shared loading, error and empty states. Then one phase per page or feature. Each
   phase has an ID, a title, a "Depends on" line and four to eight tasks; the last two tasks are
   always "Verify with Playwright MCP" and "Document phase". A page phase depends on the backend
   phase that serves it, written as `backend-dev/BE-NN`.
5. Plan the UI/UX work as phases of its own, not as polish at the end:
   - **Audit and design system**, once the core pages exist. Take the Lighthouse baseline and
     screenshots at phone and desktop width, then produce design tokens and shared components.
     The restyle must not change behaviour: the earlier scenarios have to pass unchanged.
   - **Improvements**, fixing the ranked findings for accessibility, responsive layout and feedback.
   - **Screen sizes**, designing each size class (phone, large phone, tablet, laptop, wide) and
     checking it with a screenshot matrix.
   - **Page transitions**: route transitions, prefetching from navigation, focus and title on
     navigation, reduced motion, and a performance trace.
   - Pages built after these phases use the design system from the start.
   - The last phase is the end-to-end journey with the Lighthouse gate on every page.
   - Write the plan and its findings to `docs/ui-ux-plan.md`.

## Step 2: work through the phases

Pick the first pending phase whose dependencies are all done, including its backend phase. Only
one phase is in progress at a time. For each phase:

1. **Start.** Mark the phase in progress in `task.md`. Add an entry with the start time to
   `progress.md`. Create the phase write-up in `outputs/` with these sections: requirements
   covered, tasks, scope and acceptance criteria, screens and components, API calls, tests and
   verification, problems and fixes, final status.
2. **Implement.** The UI, state management, validation, and loading, error and empty states, plus
   responsive layout and accessibility (labels, roles, keyboard access). Tick tasks in `task.md`
   as you finish them.
3. **Write the scenario.** Create `verification/phase-NN.md`: numbered steps a user would take,
   each with the result you expect to see. Cover navigation, forms and validation, data from the
   API, success, error and empty states, and dialogs. Mark the key steps `[screenshot]`. If the
   scenario needs existing data, create it in `verification/phase-NN-seed.sh` through the API.
4. **Verify.** Run the checks below in order and save each output to
   `outputs/evidence/<ID>-trial<N>-<check>.log`. One run of all of them is one trial.
5. **On failure.** Investigate, write the error into `progress.md`, fix the code, write the fix
   next to the error, rebuild or restart, and run the checks again. The third failed trial blocks
   the phase (see below).
6. **On success.** Complete the write-up, tick the remaining tasks, mark the phase done in
   `task.md`, and close its `progress.md` entry with the end time, duration, trial count and
   verdict. A phase is not done while a task is open or a write-up section is empty.

## The checks

Browser checks run against an isolated copy of the app: the UI on port 5180 and an in-memory
backend on port 8090. The copy you use on ports 5173 and 8080 is never reset, and an open tab of
yours can't interfere with a check.

| Check | Command | When |
| --- | --- | --- |
| build | `cd frontend && npm run build && npx vitest run` | every phase |
| fresh | `bash loops/frontend-dev/verification/test-env.sh start` the first time, then `test-env.sh fresh` to empty the backend again | every phase |
| seed | `API=http://localhost:8090 bash loops/frontend-dev/verification/phase-NN-seed.sh` | when the scenario needs data |
| playwright | `bash loops/_lib/playwright-verify.sh loops/frontend-dev/verification/phase-NN.md http://localhost:5180` | every phase |
| regression | `bash loops/frontend-dev/verification/regress.sh 01 02 ...` re-runs earlier scenarios, each on a fresh database | UI/UX phases and the final journey |
| lighthouse | Lighthouse through the Chrome DevTools MCP server on every page, mobile and desktop. Passes when accessibility ≥ 95, best practices ≥ 95, SEO ≥ 90 and CLS ≤ 0.1. Keep the reports in `outputs/evidence/`. | UI/UX phases and the final journey |
| screenshots | `SIZES="320x640 390x844 768x1024 1024x768 1440x900 1920x1080" bash loops/_lib/screenshots.sh <out dir> http://localhost:5180` | screen-size phase |
| trace | A Chrome DevTools performance trace while navigating between pages. Passes when INP ≤ 200 ms and CLS ≤ 0.1. | page-transitions phase |

The browser check runs the scenario through the Playwright MCP server in a separate headless
session with its own browser profile. It exits 0 only when every step passed, saves screenshots
to `outputs/evidence/`, and records the session in `execution-tracking.csv`.

## Retries, blocking and resuming

- Three failed trials block the phase. Mark it `[!]` in `task.md` and mark every phase that depends
  on it blocked as well. Write the symptom, the evidence, the fixes tried and the suspected cause
  into the phase write-up.
- A blocked phase doesn't stop the loop. Carry on with the next phase whose dependencies are done,
  and report the block at the end.
- To resume after an interruption, read `task.md`. Continue the phase marked in progress, or start
  the next runnable one. Never redo a completed phase.

## Keeping progress.md

One entry per phase, appended when the phase starts and completed when it ends:

```text
## FE-02 Tasks page
Status: done · Start: 2026-09-24 11:13 · End: 2026-09-24 11:17 · Duration: 4m · Trials: 1 (0 failed)
Trial 1: build PASS, playwright PASS (logs and screenshots in outputs/evidence/)
Errors: none · Fixes: none
Output: outputs/phase-02-tasks-page.md
```

## Invocation

| Goal | Command |
| --- | --- |
| Full PRD | `loops/run.sh frontend-dev --input PRD.md` |
| One user story | `loops/run.sh frontend-dev --input story.md --mode story` |
| One phase | `loops/run.sh frontend-dev --input PRD.md --phase FE-03` |
| Resume | `loops/run.sh frontend-dev --resume` |
| Interactive | In Claude Code: *"Run the frontend-dev loop on PRD.md"* |
| From the orchestrator | See `loops/orchestrator/Loop-instructions.md` |
