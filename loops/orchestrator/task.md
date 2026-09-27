# Tasks — orchestrator

Input: `PRD.md` · Mode: PRD · Status: **in progress**

This is the orchestrator's plan and checklist, kept by hand. Tick a task when it is finished and
change a phase's status when it starts, finishes or gets blocked.

`[ ]` not started · `[-]` in progress · `[x]` completed · `[!]` blocked

## OR-01 Requirements analysis — done

Depends on: nothing

- [x] T1 Read the full PRD
- [x] T2 Give every requirement an ID
- [x] T3 Record ambiguities and the chosen interpretations
- [x] T4 Assign each requirement to backend, frontend or both
- [x] T5 Verify: every PRD requirement appears in the analysis
- [x] T6 Document phase

## OR-02 Dependency graph — done

Depends on: OR-01

- [x] T1 Build the dependency graph
- [x] T2 Write the backend-dev plan
- [x] T3 Write the frontend-dev plan
- [x] T4 Verify: every requirement is owned by a phase, dependencies exist, no cycles
- [x] T5 Document phase

## OR-03 Backend delegation — done

Depends on: OR-02

- [x] T1 Run the backend-dev loop
- [x] T2 Verify: all backend phases done, OpenAPI served
- [x] T3 Document phase

## OR-04 Frontend delegation — in progress

Depends on: OR-03

- [-] T1 Run the frontend-dev loop
- [ ] T2 Verify: all frontend phases done
- [ ] T3 Document phase

## OR-05 Final verification and docs — pending

Depends on: OR-04

- [ ] T1 Fresh-database regression: build, unit tests, every curl script
- [ ] T2 Full user journey through Playwright MCP
- [ ] T3 Write docs/architecture.md and docs/implementation-guide.md
- [ ] T4 Update README.md
- [ ] T5 Verify the final gate
- [ ] T6 Document phase
