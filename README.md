# QuickFlow

A personal productivity app covering tasks, habits, learning resources, time-boxed plans and a
dashboard. It is built with reusable **Claude Loops**. The requirements are in [PRD.md](PRD.md).

## Prerequisites

- JDK 21+ and Maven 3.6+ (backend)
- Node.js 20+ and npm (frontend, and `npx` for the MCP servers)
- Google Chrome (the Chrome DevTools MCP server uses it for the Lighthouse audit)
- `curl` and `jq` (curl verification scripts); Python 3.8+ only for the optional Lighthouse and trace helpers in `loops/_lib/`
- Claude Code CLI (`claude`), to run the loops and the headless Playwright checks

## Run the application

```bash
# backend: http://localhost:8080 (data kept in backend/data/)
backend/run.sh start              # add --fresh for an empty in-memory database
backend/run.sh stop

# frontend: http://localhost:5173 (proxies /api to the backend)
cd frontend && npm install && npm run dev
```

| What | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| OpenAPI JSON | http://localhost:8080/v3/api-docs (exported copy: `backend/openapi.json`) |
| Health | http://localhost:8080/actuator/health |

If `JAVA_HOME` points at an older JDK, `backend/run.sh` looks for a JDK 21 install. Configuration
is through environment variables: `PORT`, `DB_URL`, `DB_PASSWORD`, `CORS_ORIGINS`.

## Tests

```bash
backend/run.sh build                                     # compile + backend unit tests
bash loops/backend-dev/verification/phase-07.sh          # every curl script on fresh databases,
                                                         # latency check, Swagger export
cd frontend && npm run build                             # type-check + production build
bash loops/frontend-dev/verification/test-env.sh start    # isolated test copy: UI :5180 -> backend :8090 (in memory)
bash loops/_lib/playwright-verify.sh loops/frontend-dev/verification/phase-01.md http://localhost:5180   # browser check
bash loops/frontend-dev/verification/regress.sh 01 02 03  # re-run scenarios, each on a fresh test database
python3 loops/_lib/nav-trace.py --url http://localhost:5180 --out /tmp/nav   # INP/CLS while navigating
bash loops/frontend-dev/verification/test-env.sh stop
python3 loops/_lib/ux-audit.py --out /tmp/ux-audit                            # Lighthouse, all pages
SIZES="320x640 768x1024 1440x900" bash loops/_lib/screenshots.sh /tmp/shots   # headless screenshots per size
```

The browser checks run the Playwright MCP server **headless** in a separate Claude Code session
with its own browser profile, so they never use your browser. They test an isolated copy of the app
(`test-env.sh`), so the app you have open on :5173 keeps its data and isn't disturbed. Each scenario lists the steps and
the results it expects, and the script exits 0 only if every step passed. Screenshots are saved to
`loops/frontend-dev/outputs/evidence/`.

`ux-audit.py` runs Lighthouse through the Chrome DevTools MCP server, headless, on every page on
mobile and desktop. It exits 0 only when accessibility ≥ 95, best practices ≥ 95, SEO ≥ 90 and
CLS ≤ 0.1. You can change the pages, devices and thresholds with `--pages`, `--devices`, `--min`
and `--max-cls`. The design goals and findings behind these thresholds are in
[docs/ui-ux-plan.md](docs/ui-ux-plan.md).

## Repository layout

```
PRD.md                     requirements (source of truth)
backend/                   Spring Boot API (run.sh, openapi.json)
frontend/                  React + TypeScript app
docs/architecture.md       stack and structure decisions
docs/ui-ux-plan.md         UI/UX design direction, audit findings and the UI/UX phases
docs/claude-loops.md       the loop design explained in plain words, and how the app was built with it
loops/                     Claude Loops: orchestrator, backend-dev, frontend-dev, _lib (verification helpers)
.mcp.json                  MCP servers: Playwright, Chrome DevTools, Context7 (browsers headless)
.claude/settings.json      hook that logs every prompt to execution-tracking.csv
execution-tracking.csv     prompts / session ids / phases / verification results
```

## Claude Loops

A Claude Loop is a reusable, file-based work cycle that a Claude Code agent follows to turn
requirements into verified code. Each loop has written instructions (`Loop-instructions.md`) and
keeps its plan and progress in two Markdown files the agent maintains by hand: `task.md` for the
phases and their checklists, and `progress.md` for what happened in each phase. The instructions
fix the order of phases, the verification gate and the 3-trial stop condition, so work is never
marked done without evidence. The loops don't depend on any particular project, and they accept
either a whole PRD or a single user story.

### Available loops

| Loop | Input | Verifies with | Output |
|---|---|---|---|
| `backend-dev` | PRD or user story | `curl` against the running backend, plus Swagger/OpenAPI | backend code, API docs, phase outputs |
| `frontend-dev` | PRD or story, plus the backend OpenAPI | Playwright MCP against the running UI; Lighthouse via Chrome DevTools MCP for UI/UX phases | frontend code, UI/UX plan, phase outputs |
| `orchestrator` | PRD or user story | the state of both loops, then a final end-to-end check | analysis, dependency graph, final docs |

Every loop folder has the same layout:

```
<loop>/
├── Loop-instructions.md   how the loop works (read by the agent)
├── task.md                the phase plan and checklist, kept by hand; also what a resume reads
├── progress.md            what happened in each phase: times, trials, errors, fixes
├── verification/          the curl scripts or browser scenarios that verify each phase
└── outputs/               one phase-NN-<name>.md per phase + evidence/ logs
```

### How to run

```bash
loops/run.sh orchestrator --input PRD.md                          # full PRD, both loops
loops/run.sh orchestrator --input "As a user, I want ..." --mode story   # one user story
loops/run.sh backend-dev  --input PRD.md                          # only the backend
loops/run.sh frontend-dev --input PRD.md                          # only the frontend
loops/run.sh backend-dev  --input PRD.md --phase BE-02            # one phase
loops/run.sh orchestrator --resume                                # continue after an interruption
```

`run.sh` opens an interactive Claude Code session with the MCP servers from `.mcp.json` loaded.
The servers are:

- `playwright`, which drives the browser for scenarios;
- `chrome-devtools`, for Lighthouse, emulation and performance traces;
- `context7`, which supplies current library documentation.

Both browser servers run headless with an isolated profile. With `--headless` it runs unattended via `claude -p`. You can also skip the script:
open Claude Code in the repo and say *"Run the backend-dev loop on PRD.md"*.

### State, retries, verification

- **State:** `task.md` holds the phase plan: each phase's status, what it depends on, and its tasks.
  `progress.md` holds, per phase, the timings, the trials with their checks, and the errors and fixes.
  The agent updates both as it works.
- **Verification:** one run of a phase's checks counts as one trial. Each check runs for real and its
  exit code decides pass or fail. Browser tests run through `loops/_lib/playwright-verify.sh`, which
  drives the Playwright MCP server in a headless child session (it never uses your browser) and exits 0
  only when every scenario step passed. UI/UX phases also run a Lighthouse gate through the Chrome
  DevTools MCP server and re-run earlier scenarios to catch regressions. All logs, screenshots and
  reports go to `outputs/evidence/`.
- **Stop condition:** a phase ends when it has been verified, or after 3 failed trials. At that point it
  is marked blocked, and so are the phases that depend on it. Independent phases keep running.
- **Resume:** run the loop again. The agent reads `task.md`, continues the phase in progress or starts
  the next one that can run, and never redoes a phase that is done.
- **Tracking:** `execution-tracking.csv` gets a row for every prompt (added automatically by the
  `UserPromptSubmit` hook in `.claude/settings.json`) and for every phase start, verification and
  finish. The row holds the real Claude session ID, or `unavailable` if none is exposed.

### Sequence diagrams

#### Orchestrator, full PRD

```mermaid
sequenceDiagram
    participant User
    participant Orchestrator
    participant BackendLoop as backend-dev
    participant FrontendLoop as frontend-dev
    participant Playwright as Playwright MCP

    User->>Orchestrator: run.sh orchestrator --input PRD.md
    Orchestrator->>Orchestrator: OR-01 requirements analysis
    Orchestrator->>Orchestrator: OR-02 dependency graph + worker plans
    Orchestrator->>BackendLoop: OR-03 run all backend phases
    BackendLoop-->>Orchestrator: phases done + Swagger/OpenAPI
    Orchestrator->>FrontendLoop: OR-04 run all frontend phases
    FrontendLoop->>Playwright: verify each feature
    Playwright-->>FrontendLoop: result
    FrontendLoop-->>Orchestrator: phases done
    Orchestrator->>Orchestrator: OR-05 final verification + docs
    Orchestrator-->>User: verified application
```

#### backend-dev phase

```mermaid
sequenceDiagram
    participant Agent
    participant Files as task.md + progress.md
    participant Backend as running backend

    Agent->>Files: pick the next phase whose dependencies are done, mark it in progress
    Agent->>Agent: implement models, rules, API, validation, OpenAPI
    Agent->>Backend: build + start
    Agent->>Backend: run the phase's curl script and the Swagger check
    Backend-->>Agent: responses (asserted), logs in outputs/evidence
    alt pass
        Agent->>Files: tick tasks, mark the phase done, record the trial
    else fail
        Agent->>Files: record the error (trial n/3)
        Agent->>Agent: fix, then verify again
    end
```

#### frontend-dev phase

```mermaid
sequenceDiagram
    participant Agent
    participant Files as task.md + progress.md
    participant App as frontend + backend
    participant Playwright as Playwright MCP
    participant DevTools as Chrome DevTools MCP

    Agent->>Files: pick the next phase whose backend phase is done, mark it in progress
    Agent->>Agent: implement screens, states, validation, API calls
    Agent->>App: build + run the isolated test copy
    Agent->>Playwright: headless session runs verification/phase-NN.md
    Playwright-->>Agent: VERDICT (PASS/FAIL per step) + screenshots
    opt UI/UX phase
        Agent->>DevTools: Lighthouse per page, mobile + desktop
        DevTools-->>Agent: scores vs thresholds + reports
    end
    alt pass
        Agent->>Files: tick tasks, mark the phase done, record the trial
    else fail
        Agent->>Files: record the error (trial n/3)
        Agent->>Agent: fix, rebuild, re-run Playwright
    end
```

#### Retry and resume

```mermaid
flowchart TD
    S[start phase] --> I[implement]
    I --> V{verify}
    V -- pass --> D[document + finish] --> N[next phase]
    V -- fail, trials < 3 --> F[record error, fix] --> V
    V -- fail, trial 3 --> B[blocked; dependants blocked too] --> N
    R[interrupted run] --> RS[run loop again] --> NX[read task.md] --> |phase in progress| I
    NX --> |next ready phase| S
```

#### Single user story

```mermaid
sequenceDiagram
    participant User
    participant Orchestrator
    participant BackendLoop as backend-dev
    participant FrontendLoop as frontend-dev

    User->>Orchestrator: run.sh orchestrator --input "As a user, I want ..." --mode story
    Orchestrator->>Orchestrator: map story to existing code, find gaps
    opt backend change needed
        Orchestrator->>BackendLoop: phase BE-S1 (added to the existing plan)
        BackendLoop-->>Orchestrator: verified with curl
    end
    opt UI change needed
        Orchestrator->>FrontendLoop: phase FE-S1
        FrontendLoop-->>Orchestrator: verified with Playwright MCP
    end
    Orchestrator-->>User: story verified
```
