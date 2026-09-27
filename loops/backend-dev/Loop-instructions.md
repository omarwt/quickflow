# backend-dev — Loop instructions

A reusable loop that turns requirements into a working backend, one phase at a time. Nothing here
is specific to one product: the stack, the data model and the endpoints all come from the input.

## What "done" means

A phase is done only when its endpoints were called with real `curl` requests against the running
server and every check passed. Code that merely compiles is not done.

## What you work with

| File or folder | What it is for |
| --- | --- |
| `PRD.md` or a user story | The input. A PRD gives the whole plan; a story adds one or two phases to an existing plan. |
| `task.md` | The phase plan and its checklist. You keep it up to date by hand. |
| `progress.md` | The history of each phase: when it ran, how many trials, what failed, what was fixed. |
| `outputs/phase-NN-<name>.md` | One write-up per phase. |
| `outputs/evidence/` | The log of every verification run. |
| `verification/phase-NN.sh` | The curl script that verifies a phase. |
| `backend/` | The code. Swagger UI and the OpenAPI document are served by the running app. |

You need `curl`, `jq` and the build tool of the chosen stack.

## Step 1: read and plan

Skip this step when `task.md` already lists phases; then go straight to step 2.

1. Read the whole input. List its requirements, business rules, data model and acceptance
   criteria. Keep the IDs the input already has; invent IDs only where it has none.
2. Pick the stack. Follow the PRD or the repository if they name one. Otherwise choose a
   mainstream, strongly typed stack with OpenAPI support. Record the choice in `docs/architecture.md`.
3. Write the phases into `task.md`. The first phase is the foundation: project skeleton,
   persistence, a uniform error format and OpenAPI. Then one phase per domain slice, in dependency
   order. Each phase has an ID, a title, a "Depends on" line and four to eight tasks. The last two
   tasks are always "Verify with curl" and "Document phase".
4. In story mode, add one or two phases with IDs that cannot clash with existing ones, such as `BE-S1`.

## Step 2: work through the phases

Pick the first pending phase whose dependencies are all done. Only one phase is in progress at a
time. For each phase:

1. **Start.** Mark the phase in progress in `task.md`. Add an entry with the start time to
   `progress.md`. Create the phase write-up in `outputs/` with these sections: requirements
   covered, tasks, implementation, files changed, APIs, tests and verification, problems and
   fixes, final status.
2. **Implement.** Migrations and models, business rules, endpoints, validation, error handling,
   security where the input asks for it, and OpenAPI annotations. Tick tasks in `task.md` as you
   finish them.
3. **Write the check.** Create `verification/phase-NN.sh`, a curl script that may source
   `loops/_lib/curl-lib.sh`. It must cover the success path, validation failures, not found,
   business-rule failures, invalid parameters and edge cases. It asserts both the status code and
   the body, and exits 0 only when everything passed.
4. **Verify.** Start the backend, then run these three checks and save each output to
   `outputs/evidence/<ID>-trial<N>-<check>.log`. One run of all three is one trial.

   | Check | Command |
   |---|---|
   | build | `backend/run.sh build` (compile plus unit tests) |
   | curl | `bash loops/backend-dev/verification/phase-NN.sh` |
   | swagger | fetch `http://localhost:8080/v3/api-docs` and confirm every new path is listed |

5. **On failure.** Read the logs. Write the error into `progress.md`, fix the code, write the fix
   next to the error, and run the checks again. The third failed trial blocks the phase (see below).
6. **On success.** Complete the write-up, tick the remaining tasks, mark the phase done in
   `task.md`, and close its `progress.md` entry with the end time, duration, trial count and
   verdict. A phase is not done while a task is open or a write-up section is empty.

## Testing rules

- Every endpoint of the phase is called with curl. A green build and unit tests alone never verify a phase.
- Unit tests are welcome where they check real business logic. Don't write them to raise coverage.

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
## BE-02 Tasks
Status: done · Start: 2026-09-24 10:31 · End: 2026-09-24 10:55 · Duration: 24m · Trials: 1 (0 failed)
Trial 1: build PASS, curl PASS, swagger PASS (logs in outputs/evidence/)
Errors: none · Fixes: none
Output: outputs/phase-02-tasks.md
```

## Invocation

| Goal | Command |
| --- | --- |
| Full PRD | `loops/run.sh backend-dev --input PRD.md` |
| One user story | `loops/run.sh backend-dev --input "As a user, I want ..." --mode story` |
| One phase | `loops/run.sh backend-dev --input PRD.md --phase BE-02` |
| Resume | `loops/run.sh backend-dev --resume` |
| Interactive | In Claude Code: *"Run the backend-dev loop on PRD.md"* |
| From the orchestrator | See `loops/orchestrator/Loop-instructions.md` |
