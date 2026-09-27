# orchestrator — Loop instructions

The orchestrator coordinates backend-dev and frontend-dev for a whole PRD or for a single user
story. It decides what gets built and in what order. The two worker loops do the building and the
verifying.

## What you work with

| File or folder | What it is for |
| --- | --- |
| `PRD.md` or a user story | The input. |
| `task.md` | The orchestrator's own phases and checklist. You keep it up to date by hand. |
| `progress.md` | The history of each orchestrator phase. |
| `outputs/` | One write-up per phase: the requirements analysis, the dependency graph, the delegations and the final verification. |
| `loops/backend-dev/` and `loops/frontend-dev/` | The worker loops. Their `task.md` files tell you what is planned, done and blocked. |

## Full PRD

```text
PRD → analysis → dependency graph → backend-dev → OpenAPI → frontend-dev → final verification
```

The orchestrator has five phases. Write them into `task.md` when you start, then run each one
with the same cycle the worker loops use: start it, do the work, verify it, document it, finish it.

**OR-01 Requirements analysis.** Read the whole PRD. Give every requirement an ID, keeping the
IDs the PRD already has. Record what is ambiguous or missing, and the interpretation you chose.
Don't invent business rules: where the PRD doesn't decide something, pick the most conservative
reading and write it down. Assign each requirement to backend, frontend or both. Write it all to
`outputs/phase-01-requirements-analysis.md`. Verified when every requirement in the PRD appears
in the analysis.

**OR-02 Dependency graph and worker plans.** Draw the graph requirement → backend phase → API →
frontend phase as a Mermaid diagram, with the execution order and what can run in parallel. From
it, write the phase plans into `loops/backend-dev/task.md` and `loops/frontend-dev/task.md`. Each
frontend page phase depends on the backend phase that serves it, written as `backend-dev/BE-NN`.
The frontend plan includes the UI/UX phases described in the frontend-dev instructions, each with
its own requirement IDs from the analysis. Write the graph to
`outputs/phase-02-dependency-graph.md`. Verified when every requirement ID is owned by a worker
phase, every dependency names a real phase, and there are no cycles.

**OR-03 Backend delegation.** Run backend-dev by following its instructions in this session, or
with `loops/run.sh backend-dev --input PRD.md`. Verified when every phase in
`loops/backend-dev/task.md` is done and the app serves its OpenAPI document.

**OR-04 Frontend delegation.** Run frontend-dev the same way. Verified when every phase in
`loops/frontend-dev/task.md` is done.

**OR-05 Final verification and docs.** On a fresh database: build, unit tests, every curl script,
and the full user journey through the Playwright MCP server. Then write `docs/architecture.md`
and `docs/implementation-guide.md`, and update the root `README.md` with how to install, run and
test the app, plus the Swagger and frontend URLs. Keep the README's existing Claude Loops
section; it is the only README in the project. Never put progress or status in the README; that
belongs in each loop's `progress.md`.

## Single user story

```text
story → analysis (map it to existing code and requirements) → dependency check → backend-dev (if needed) → frontend-dev (if needed) → verification
```

Give story phases IDs that won't clash with existing ones, such as `BE-S1` and `FE-S1`, so they
sit alongside the existing plan. If the story is already covered, just verify it and record the evidence.

## Parallelism

Backend and frontend phases can run at the same time only when no dependency path connects them
and they don't edit the same files. Each worker loop has at most one phase in progress.

## Retries, blocking and resuming

- Orchestrator phases follow the same rule as the workers: three failed trials block the phase.
- A blocked worker phase doesn't stop the orchestrator. It carries on with independent work and
  reports the block at the end.
- To resume, run the orchestrator again. It reads all three `task.md` files and never redoes a
  completed phase.

## Keeping progress.md

One entry per phase, appended when the phase starts and completed when it ends:

```text
## OR-03 Backend delegation
Status: done · Start: 2026-09-24 10:39 · End: 2026-09-24 10:55 · Duration: 16m · Trials: 1 (0 failed)
Trial 1: backend-complete PASS, openapi PASS (logs in outputs/evidence/)
Errors: none · Fixes: none
Output: outputs/phase-03-backend-delegation.md
```

## Invocation

| Goal | Command |
| --- | --- |
| Whole PRD | `loops/run.sh orchestrator --input PRD.md` |
| One user story end to end | `loops/run.sh orchestrator --input "As a user, I want ..." --mode story` |
| Resume | `loops/run.sh orchestrator --resume` |
| Interactive | In Claude Code: *"Run the orchestrator loop on PRD.md"* |
