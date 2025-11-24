# todo-backend

Backend for the personal Todo application. Node.js + Express + TypeScript, MongoDB (Mongoose), JWT auth (access + httpOnly refresh cookie), Zod validation, and OpenAPI/Swagger.

> **Registration policy:** Only a **superadmin** can create users. There is no public register endpoint.

---

## Features

- **Auth:** JWT access tokens, httpOnly **refresh** cookie, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`.
- **RBAC:** `authGuard` + `requireRole('superadmin')` middleware.
- **Admin-only users:** `POST /api/users` creates users and is restricted to superadmin.
- **Projects:** per-user projects for grouping tasks; each user sees only their own projects, while **superadmin** can manage any project.
- **Tasks:** tasks live inside projects and support status, priority, tags, and optional dates; endpoints support filtering and pagination.
- **Calendar:** range-based calendar endpoint that exposes tasks with `startAt` / `dueAt` as calendar events, with the same ownership rules as projects/tasks.
- **Validation:** Zod schemas for requests/responses; runtime validation + shared types.
- **Docs:** OpenAPI v3 with Swagger UI at `/api/docs`, JSON at `/api/openapi.json`.
- **Error handling:** Central error middleware, Zod-aware 400s, consistent JSON.
- **Bootstrap:** Optional one-time superadmin seeding via env flags.
- **Tests:** Vitest + Supertest + mongodb-memory-server integration tests.

---

## API Overview

Base URL is `/api`.

### Auth

- `POST /api/auth/login` → `{ accessToken, user }` + sets `refresh_token` httpOnly cookie.
- `POST /api/auth/refresh` → `{ accessToken }` (reads `refresh_token` cookie).
- `POST /api/auth/logout` → `204 No Content` and clears `refresh_token` cookie.
- `GET /api/auth/me` → current user (requires **Bearer** access token).

### Users (admin-only)

- `POST /api/users` → create user (superadmin only).

### Projects

- `POST /api/projects` → create a new project for the current user.
- `GET /api/projects` → list projects owned by the current user.
- `PATCH /api/projects/{id}` → update project name/color (owner or superadmin).
- `DELETE /api/projects/{id}` → delete a project (owner or superadmin).

### Tasks

- `POST /api/projects/{projectId}/tasks` → create a task in the given project (owner or superadmin).
- `GET /api/projects/{projectId}/tasks` → list tasks in a project with filters and pagination.
- `GET /api/tasks/{id}` → get a task by id (project owner or superadmin).
- `PATCH /api/tasks/{id}` → partially update a task (project owner or superadmin).

Task list filters (`GET /api/projects/{projectId}/tasks`):

- `status`: `todo | doing | done`.
- `priority`: `low | normal | high`.
- `tag`: filter by a single tag.
- `q`: case-insensitive search in the task title.
- `dueFrom`, `dueTo`: ISO datetimes for due date range.
- `limit`, `offset`: pagination (default limit is 20).

### Calendar

- `GET /api/calendar` → returns calendar events derived from tasks that have `startAt` and/or `dueAt` in the specified range.

Query parameters (all ISO8601 strings):

- `from` (required): start of the range (inclusive).
- `to` (required): end of the range (inclusive).
- `projectId` (optional): if specified, restricts events to a single project and enforces project ownership rules.

Response shape (per event):

```jsonc
{
  "id": "...", // task id
  "title": "...", // task title
  "start": "ISO date",
  "end": "ISO date", // optional (when both startAt and dueAt are present)
  "allDay": true, // optional
  "projectId": "...",
  "status": "todo|doing|done",
  "priority": "low|normal|high",
}
```

Ownership rules:

- Regular users see only events from their own projects.
- `superadmin` can see events from all projects.

---

Swagger UI: `GET /api/docs`
OpenAPI JSON: `GET /api/openapi.json`

---

## Environment

The backend reads environment variables via `dotenv`:

```env
# HTTP
PORT=8080
CORS_ORIGIN=http://localhost:5173

# Mongo
MONGO_URI=mongodb://localhost:27017/todo

# JWT
JWT_ACCESS_SECRET=change_me_access
JWT_REFRESH_SECRET=change_me_refresh
ACCESS_TTL=5m   # examples: 300, 15m, 7d
REFRESH_TTL=1d

# Bootstrap first superadmin
ALLOW_BOOTSTRAP=true
BOOTSTRAP_SUPERADMIN_EMAIL=admin@example.com
BOOTSTRAP_SUPERADMIN_PASSWORD=admin123
```

> **Important:** After the first successful bootstrapping, disable it in production:
>
> - set `ALLOW_BOOTSTRAP=false` and/or remove `BOOTSTRAP_*`.

**CORS:** If you use cookies or Authorization headers from the browser, set `CORS_ORIGIN` to an explicit origin (e.g., your frontend domain), not `*`.

---

## Local Development

### With Node

```bash
# in backend/
npm ci
npm run dev
```

Requires a running MongoDB at `MONGO_URI`. Quick local Mongo (Docker):

```bash
docker run --name todo-mongo -d -p 27017:27017 -v todo_mongo:/data/db mongo:7
```

### With Docker (backend only)

```bash
# build
docker build -t todo-backend:dev .
# run
docker run --rm -p 8080:8080 --env-file ../infra/.env todo-backend:dev
```

### With docker-compose (dev stack)

Use `infra/docker-compose.dev.yml` in repo root. It brings up Mongo, backend, and Caddy.

---

## Testing

Integration tests run against an **in-memory MongoDB**:

```bash
# in backend/
npm test
```

Stack: Vitest + Supertest + mongodb-memory-server.

Test entry examples:

- `src/features/auth/auth.test.ts` — auth and user creation / permissions.
- `src/features/projects/projects.test.ts` — project CRUD and access control.
- `src/features/tasks/tasks.test.ts` — task CRUD, filters, pagination, and access control.
- `src/features/calendar/calendar.test.ts` — calendar range queries, project filters, and ownership rules.

To run a single test file:

```bash
npx vitest run src/features/auth/auth.test.ts
```

To reduce logs during tests, `NODE_ENV=test` disables request logging.

---

## Project Structure (backend)

```text
backend/
├── src/
│   ├── app.ts                 # Express app wiring (middlewares, routes, Swagger, errors)
│   ├── server.ts              # Entry point (Mongo connect, bootstrap, listen)
│   ├── bootstrap.ts           # Optional superadmin seeding
│   ├── common/
│   │   ├── auth.ts            # JWT sign/verify, guards, refresh cookie helpers
│   │   ├── errors.ts          # 404 + centralized error handler (Zod-aware)
│   │   ├── validate.ts        # Zod-based request validator middleware
│   │   └── async.ts           # asyncHandler wrapper
│   ├── config/
│   │   ├── env.ts             # env/flags
│   │   └── logger.ts          # simple console logger
│   ├── db/
│   │   └── index.ts           # Mongo connect helper
│   ├── docs/
│   │   ├── registry.ts        # OpenAPI registry (zod-to-openapi)
│   │   ├── openapi.ts         # OpenAPI document builder
│   │   └── swagger.ts         # mounts Swagger UI and openapi.json
│   ├── features/
│   │   ├── auth/
│   │   │   ├── auth.schemas.ts     # Zod schemas (Role, LoginBody, MeResponse, LoginResponse)
│   │   │   ├── auth.controller.ts  # login/refresh/logout/me controllers
│   │   │   └── auth.routes.ts      # routes + OpenAPI path registration
│   │   ├── users/
│   │   │   ├── user.model.ts       # Mongoose User schema (hashes password)
│   │   │   ├── users.schemas.ts    # Zod schemas (CreateUserBody, UserResponse)
│   │   │   ├── users.controller.ts # create user (superadmin only)
│   │   │   └── users.routes.ts     # routes + OpenAPI path registration
│   │   ├── projects/
│   │   │   ├── projects.model.ts       # Mongoose Project schema (ownerId, color, timestamps)
│   │   │   ├── projects.schemas.ts     # Zod schemas (Create/UpdateProject, ProjectResponse)
│   │   │   ├── projects.controller.ts  # project CRUD for owner/superadmin
│   │   │   └── projects.routes.ts      # routes + OpenAPI path registration
│   │   ├── tasks/
│   │   │   ├── tasks.model.ts          # Mongoose Task schema (status, priority, tags, dates)
│   │   │   ├── tasks.schemas.ts        # Zod schemas (Create/UpdateTask, ListTasksQuery, TaskResponse)
│   │   │   ├── tasks.controller.ts     # task CRUD, filters, and access checks
│   │   │   └── tasks.routes.ts         # routes + OpenAPI path registration
│   │   ├── calendar/
│   │   │   ├── calendar.schemas.ts     # Zod schemas (CalendarQuery, CalendarEvent)
│   │   │   ├── calendar.controller.ts  # calendar aggregation over tasks
│   │   │   └── calendar.routes.ts      # route + OpenAPI path registration
│   │   └── **/*.test.ts                # integration tests per feature
├── Dockerfile
├── eslint.config.js
├── package.json
├── tsconfig.json
└── README.md (this file)
```

---

## Middleware & Errors

- `authGuard` reads `Authorization: Bearer <token>` and attaches `req.user`.
- `requireRole('superadmin')` enforces admin-only endpoints.
- `validate({ body/query/params })` parses parts of the request via Zod; on fail returns 400 with details.
- Centralized `errorHandler` returns JSON; Zod errors get a structured `details` field.

---

## OpenAPI / Swagger

- We use [`@asteasolutions/zod-to-openapi`](https://github.com/asteasolutions/zod-to-openapi) to derive OpenAPI from Zod schemas and route registrations.

- Access via:
  - **UI**: `GET /api/docs`
  - **JSON**: `GET /api/openapi.json`

- Global `bearerAuth` security is enabled, but `/auth/login`, `/auth/refresh`, `/auth/logout` explicitly override it (no bearer required).

---

## Deployment (overview)

- CI builds/pushes Docker images to GHCR on tag push `v*`.
- CD deploys to your server via SSH and `docker-compose.prod.yml` (Mongo + backend + Caddy).
- Backend image: `ghcr.io/<owner>/todo-backend:<tag>` and `:latest`.

> See `.github/workflows/release.yml` and `infra/` for details.

---

## Security Notes

- Rotate `JWT_*_SECRET` for production; keep them out of VCS.
- Keep `ALLOW_BOOTSTRAP=false` in production after initial admin creation.
- Use HTTPS (Caddy handles TLS) and limit `CORS_ORIGIN` to your frontend origin when cookies are used.

---

## Scripts

```json
{
  "dev": "tsx watch src/server.ts",
  "build": "tsc -p tsconfig.json",
  "start": "node dist/server.js",
  "lint": "eslint \"src/**/*.{ts,tsx}\"",
  "test": "vitest run --reporter=dot"
}
```

---

## License

This project is licensed under the terms of the repository's LICENSE file.
