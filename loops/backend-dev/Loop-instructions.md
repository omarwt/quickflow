# backend-dev — Loop instructions

Reusable loop that plans, implements, documents and verifies a backend. Nothing here is specific to
one project: the product, stack and endpoints all come from the input.

## Purpose
Turn requirements into a running backend with Swagger/OpenAPI, one phase at a time. A phase is done
only when its endpoints were called with real `curl` requests against the running server and passed.

## Inputs
- `PRD.md` (mode `prd`) **or** a single user story / requirement (mode `story`, file or text)
- Existing state in `state/` and existing code in `backend/` (used to resume or extend)

## Outputs
| File | Content |
|---|---|
| `task.md` | checklist per phase (rendered by `loop.py`) |
| `progress.md` | start/end, duration, tokens, retries, tests, errors, fixes per phase (rendered) |
| `state/loop-state.json` | machine-readable state used to resume |
| `plan.json` | the phase plan you write |
| `outputs/phase-NN-<name>.md` | one document per phase |
| `outputs/evidence/` | logs of every verification run |
| `backend/` | the code; Swagger UI and OpenAPI JSON are served by the running app |

## Preconditions
`python3`, `curl`, `jq`, and the build tool of the chosen stack.

## Process

**1. Initialise (idempotent, safe to repeat when resuming)**
```
python3 loops/_lib/loop.py init backend-dev --input <PRD.md|story.md> --mode <prd|story>
```

**2. Analyse and plan (skip if `state/` already has phases)**
- Read the whole input. List its requirements, rules, data model and acceptance criteria. Use the IDs the input already has; make up IDs only where it has none.
- Pick the stack: follow the PRD or repository if they name one, otherwise choose a mainstream, strongly typed stack with OpenAPI support. Record the choice in `docs/architecture.md`.
- Write `loops/backend-dev/plan.json`. In story mode the plan is usually 1–2 phases, with IDs that don't clash with existing ones.
  ```json
  {"phases": [{"id": "BE-01", "title": "Foundation", "requirements": ["..."], "dependsOn": [],
               "tasks": ["Analyse requirements", "Implement ...", "Verify with curl", "Document phase"]}]}
  ```
  Phase 1 is the foundation: project skeleton, persistence, error format, OpenAPI. Then one phase per domain slice, in dependency order.
- `python3 loops/_lib/loop.py plan backend-dev loops/backend-dev/plan.json`

**3. Run every phase in this cycle**
```
next → start → implement → verify ──pass──► document → finish
                   ▲            │
                   └─ fix ◄─ fail (trial < 3)      fail on trial 3 → blocked
```
1. `loop.py next backend-dev` tells you which phase to start or resume.
2. `loop.py start backend-dev <ID>` refuses to start if a dependency isn't done. It also creates the phase output file.
3. Implement the phase: migrations/models, business rules, APIs, validation, error handling, security where the input needs it, and OpenAPI annotations. Tick tasks as you go with `loop.py task backend-dev <ID> T1 T2`.
4. Write a curl script, `loops/backend-dev/verification/phase-NN.sh` (it can use `loops/_lib/curl-lib.sh`). It must cover success, validation failures, not found, business-rule failures, invalid parameters, error responses and edge cases, and assert both status codes and bodies.
5. Start the backend, then verify. One `verify` call is one trial:
   ```
   python3 loops/_lib/loop.py verify backend-dev <ID> \
     --check "build=<build + unit tests>" \
     --check "curl=bash loops/backend-dev/verification/phase-NN.sh" \
     --check "swagger=curl -sf http://localhost:<port>/v3/api-docs | jq -e '.paths[\"/api/...\"]'"
   ```
6. On FAIL: read the logs in `outputs/evidence/`, record the error with `loop.py note backend-dev <ID> --error "..."`, fix it, record the fix with `--fix "..."`, and verify again.
7. On PASS: fill in the phase output (implementation, files changed, APIs, tests, problems and fixes), tick the remaining tasks, then run `loop.py finish backend-dev <ID>`. `finish` refuses to run until verification has passed, every task is done, and no `_TODO_` is left in the output.

## Testing
- Code that compiles is not verified. Every endpoint of the phase is called with curl.
- Unit tests are optional. Add them where they check real business logic, not to raise coverage.

## State, retries and the stop condition
- A phase ends when it is **verified**, or after **3 failed trials**. At that point `loop.py` marks it `blocked`, and every phase that depends on it becomes `blocked_by_dependency`.
- After a block, write the symptom, evidence, fixes tried and suspected cause into the phase output. Then carry on with `loop.py next`, since independent phases can still run.
- Resume by running the loop again. Completed phases are never redone.

## Invocation
| Goal | Command |
|---|---|
| Full PRD | `loops/run.sh backend-dev --input PRD.md` |
| One user story | `loops/run.sh backend-dev --input "As a user, I want ..." --mode story` |
| One phase | `loops/run.sh backend-dev --input PRD.md --phase BE-02` |
| Resume | `loops/run.sh backend-dev --resume` |
| Interactive | in Claude Code: *"Run the backend-dev loop on PRD.md"* |
| From the orchestrator | see `loops/orchestrator/Loop-instructions.md` |
