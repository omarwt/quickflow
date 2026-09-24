# BE-01 Foundation

## Requirements covered

- NFR-3
- NFR-7
- I-1
- I-2
- UX-SET

## Tasks

- T1 Choose stack and record it in docs/architecture.md
- T2 Project skeleton, config, persistence and migrations
- T3 Uniform error format and validation handling
- T4 Swagger/OpenAPI and CORS
- T5 Settings resource (profile, preferences, timezone)
- T6 Verify with curl
- T7 Document phase

## Implementation

Stack: Java 21, Spring Boot 3.3, H2 file database, Flyway, springdoc-openapi. The reasons are in `docs/architecture.md`.

- **Error format:** `ErrorHandler` turns every failure into RFC 7807 problem+json. That covers bean validation, unreadable JSON, a bad enum in the body or a query parameter (the message lists the allowed values), not-found, business-rule failures (`ApiException`: 400 or 409), integrity violations (409), and unexpected errors (500, with no internals exposed). Framework errors such as 404 no-route and 405 keep the same shape.
- **Time:** a `Clock` bean is the only source of "now". It ticks in milliseconds, so responses match what H2 stores. `SettingsService.today()` answers "today" in the user's timezone (I-2).
- **Settings:** a single row, created by migration V1. `PUT` validates the display name (required, max 100), the email format, the IANA timezone and the default-view enum.
- **Security (I-1):** no login, because there is one user. CORS only allows the frontend origin (`CORS_ORIGINS`), persistence goes through JPA with bound parameters, and no secrets are committed.
- **Tooling:** `backend/run.sh build|start [--fresh]|stop`. `--fresh` uses an empty in-memory database, and every curl script starts from that. If `JAVA_HOME` points at an older JDK, the script falls back to a JDK 21 install.

## Files changed

- `backend/pom.xml`, `backend/run.sh`
- `backend/src/main/resources/application.yml`, `db/migration/V1__settings.sql`
- `backend/src/main/java/com/quickflow/QuickflowApplication.java`
- `backend/src/main/java/com/quickflow/common/{AppConfig,ErrorHandler,ApiException,NotFoundException}.java`
- `backend/src/main/java/com/quickflow/settings/{Settings,SettingsRepository,SettingsDto,SettingsService,SettingsController}.java`
- `backend/src/test/java/com/quickflow/ApplicationTest.java`
- `docs/architecture.md`, `loops/backend-dev/verification/phase-01.sh`

## APIs / components

| Method | Path | Result |
|---|---|---|
| GET | /api/settings | 200 Settings |
| PUT | /api/settings | 200 · 400 validation |
| GET | /actuator/health | 200 |
| GET | /v3/api-docs, /swagger-ui.html | OpenAPI JSON, Swagger UI |

## Tests and verification

Trial 1 passed with 4 checks: build with unit tests, start on a fresh database, the curl script, and Swagger documenting `PUT /api/settings`.

The curl script's 25 assertions cover health, the OpenAPI document, Swagger UI, default settings, update with trimming, persistence on re-read, a blank name, an unknown timezone, a bad email, an invalid enum listing the allowed values, malformed JSON, 404 on an unknown route with a problem+json content type, 405, and CORS (the frontend origin is allowed, other origins are rejected).

Unit test: `ApplicationTest` boots the whole context, which proves the migrations and entity mappings agree. Logs are in `outputs/evidence/BE-01-trial1-*.log`.

## Problems found and fixes

None. The JDK 8 `JAVA_HOME` found in the discarded first attempt was handled up front in `run.sh`.

## Final status

Done. Verified on trial 1.
