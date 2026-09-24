# Architecture

## Backend

**Stack:** Java 21, Spring Boot 3.3 (web, validation, data-jpa), H2 in file mode, Flyway migrations,
springdoc-openapi (Swagger UI), JUnit 5.

Why this stack:
- The PRD doesn't name one. QuickFlow is a single-user app that needs persistent state (NFR-3),
  strict validation (BR-1 … BR-14) and documented APIs, and this stack covers all three with no
  extra infrastructure.
- H2 in file mode needs no database server. Data lives in `backend/data/`. Flyway owns the schema,
  so it can be moved to PostgreSQL later by changing the JDBC URL.
- springdoc generates the OpenAPI document from the code, so the Swagger document the frontend
  consumes can't drift from the real API.

Structure: one package per feature (`settings`, `task`, `habit`, `learning`, `plan`, `dashboard`),
each holding its entity, repository, service, DTOs and controller. `common` holds configuration and
the error handler. Business rules live in entities and services, not in controllers (NFR-7).

Conventions:
- Errors are RFC 7807 `application/problem+json`. Validation errors carry `errors: [{field, message}]`.
- 400 means invalid input, 404 means unknown id (deleted resources included), 409 means a conflict
  with current state (e.g. a duplicate habit completion).
- Timestamps are ISO-8601 UTC. Dates are local dates in the timezone set in Settings, and
  `SettingsService.today()` is the single place that decides what "today" is.
- There is no authentication, since the app has a single user (decision I-1). CORS only allows the
  frontend origin (`CORS_ORIGINS`).

Run: `backend/run.sh start` · Swagger UI: http://localhost:8080/swagger-ui.html · OpenAPI: http://localhost:8080/v3/api-docs

## Frontend

**Stack:** React 19, TypeScript 5.9 (strict), Vite, React Router, TanStack Query, openapi-typescript.

Why:
- TanStack Query caches server state and makes cross-page updates simple. When a plan item is ticked,
  invalidating the `plans`, `tasks`, `habits` and `dashboard` queries refreshes every page that shows
  them (FR-08).
- The API types in `src/api/schema.d.ts` are generated from `backend/openapi.json` (`npm run gen:api`).
  When the backend contract changes, the frontend stops compiling instead of breaking at runtime.
- There's no component library. The six pages only need forms, lists, dialogs and toasts, and plain
  CSS with design tokens (`src/index.css`) covers that.

Structure: `src/api` (client and generated types), `src/components` (layout and shared UI: dialog,
toast, field, empty/error/loading states), `src/pages` (one file per page). The Vite dev server
proxies `/api` to the backend on :8080, so the browser only talks to one origin.

Known contract gap: springdoc marks every response field as optional. `Model<>` in `src/api/client.ts`
treats response fields as present, and nullable ones (description, dueDate, …) are handled in the pages.

Run: `cd frontend && npm install && npm run dev` → http://localhost:5173
