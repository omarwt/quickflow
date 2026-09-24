# orchestrator — Loop instructions

Coordinates backend-dev and frontend-dev for a full PRD or a single user story. The orchestrator
decides what gets built and in what order. The two worker loops do the building and the verifying.

## Inputs
`PRD.md` (mode `prd`) or one user story / requirement (mode `story`), plus the state of all three loops.

## Outputs
`task.md`, `progress.md`, `state/`, `plan.json` and `outputs/`:
- `outputs/phase-01-requirements-analysis.md`: every requirement with an ID, what is ambiguous or missing, the interpretation chosen, and which loop owns it (backend, frontend or both)
- `outputs/phase-02-dependency-graph.md`: a Mermaid graph of requirement → backend phase → API → frontend phase, the execution order, and what can run in parallel
- one output per later phase (delegations, final verification)

## Process

**Full PRD**
```
PRD → analysis → dependency graph → backend-dev → Swagger/OpenAPI → frontend-dev (Playwright) → final verification
```
1. Run `loop.py init orchestrator --input PRD.md --mode prd`. Then write `loops/orchestrator/plan.json` with these phases: OR-01 analysis, OR-02 dependency graph and worker plans, OR-03 backend, OR-04 frontend, and OR-05 final verification and docs. Load it with `loop.py plan orchestrator loops/orchestrator/plan.json`.
2. **OR-01:** analyse the requirements. Don't invent business rules. Where the input doesn't decide something, pick the most conservative reading and record it.
3. **OR-02:** build the dependency graph. Write `loops/backend-dev/plan.json` and `loops/frontend-dev/plan.json` from it, then init and plan both loops. Frontend phases depend on their backend phase through `ext:backend-dev/<ID>`. The frontend plan includes the UI/UX phases described in frontend-dev (audit + design system, improvements, and the final `ux-audit.py` gate), each with its own requirement IDs in the analysis.
4. **OR-03:** run backend-dev (follow its Loop-instructions in this session, or run `loops/run.sh backend-dev ...`). OR-03 is verified once `loop.py status backend-dev` shows every phase done.
5. **OR-04:** run frontend-dev the same way.
6. **OR-05:** final verification on a fresh database: build, unit tests, every curl script, and the full user journey through Playwright MCP. Then write `docs/architecture.md`, `docs/implementation-guide.md` and update the root `README.md`: add how to install, run and test the app, plus the Swagger and frontend URLs. Keep its existing Claude Loops section; it is the only README in the project. Never put progress or status in the README; that belongs in each loop's `progress.md`.

Each orchestrator phase uses the same `start → verify → finish` commands as the worker loops.

**Single user story**
```
story → analysis (map it to existing code and requirements) → dependency check → backend-dev (if needed) → frontend-dev (if needed) → verification
```
Give story phases IDs that won't clash with existing ones (`BE-S1`, `FE-S1`) so they merge into the existing state. If the story is already covered, just verify it and record the evidence.

## Parallelism
Backend and frontend phases can run at the same time only when no dependency path connects them and they don't edit the same files. `loop.py` enforces the cross-loop dependencies and allows only one in-progress phase per loop.

## Retries and resume
The 3-trial rule applies to orchestrator phases too. A blocked worker phase doesn't stop the orchestrator: it carries on with independent work and reports the block at the end. To resume, run the orchestrator again. It reads all three `state/` folders and never redoes completed phases.

## Invocation
| Goal | Command |
|---|---|
| Whole PRD | `loops/run.sh orchestrator --input PRD.md` |
| One user story end to end | `loops/run.sh orchestrator --input "As a user, I want ..." --mode story` |
| Resume | `loops/run.sh orchestrator --resume` |
| Interactive | in Claude Code: *"Run the orchestrator loop on PRD.md"* |
