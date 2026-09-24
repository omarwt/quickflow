# BE-07 API regression

## Requirements covered

- NFR-1

## Tasks

- T1 Run every curl script on a fresh database
- T2 Check response times under 500 ms
- T3 Confirm Swagger documents every endpoint
- T4 Verify
- T5 Document phase

## Implementation

`verification/phase-07.sh` is the backend regression gate:

1. **Regression.** It runs each of the six phase scripts against its own freshly started, empty database. The scripts assume a clean state, so they can't leak data into each other.
2. **Latency (NFR-1).** It warms up with 50 tasks, then times typical actions with `curl -w %{time_total}`: create, update, filter, complete and delete a task, create a habit, and load the dashboard. Any action at 500 ms or slower fails the check.
3. **Swagger.** It exports `/v3/api-docs` to `backend/openapi.json`, which is the input contract for frontend-dev. It then checks that every feature's paths are documented and that every operation declares its responses.

No application code changed in this phase.

## Files changed

- `loops/backend-dev/verification/phase-07.sh`
- `backend/openapi.json` (exported contract: 40 operations, 27 schemas)

## APIs / components

No new APIs. The full contract is in `backend/openapi.json`, and the running backend serves it at http://localhost:8080/swagger-ui.html.

## Tests and verification

Trial 1 passed with 2 checks, build with unit tests and the regression script:

- **Curl scripts on fresh databases:** 202 assertions across 6 scripts, all passing (BE-01 25, BE-02 52, BE-03 36, BE-04 32, BE-05 44, BE-06 13).
- **Latency:** create task 11 ms, update 15 ms, filter 142 ms, complete 11 ms, delete 9 ms, create habit 46 ms, dashboard 62 ms, all well under 500 ms.
- **Swagger:** all 13 feature path groups are documented, and every operation declares its responses.
- **Unit tests:** 14, all passing (`ApplicationTest` 1, `TaskTest` 3, `HabitProgressTest` 4, `PlanPolicyTest` 5, `DashboardServiceTest` 1).

## Problems found and fixes

None.

## Final status

Done. Verified on trial 1. The backend is complete and the contract has been handed off in `backend/openapi.json`.
