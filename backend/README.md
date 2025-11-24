# todo-backend

Backend for a personal Todo application.

* Node.js + Express + TypeScript
* MongoDB via Mongoose
* JWT auth (access token + httpOnly refresh cookie)
* Zod validation + OpenAPI/Swagger docs

> **Registration policy:** Only a **superadmin** can create users. There is no public registration endpoint.

---

## Features

* **Auth & Users**

  * JWT access tokens, httpOnly refresh cookie.
  * `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/me`.
  * `POST /api/users` — create users (**superadmin** only).

* **Projects**

  * Per-user projects to group tasks.
  * Each user sees only their own projects; **superadmin** can manage any project.
  * CRUD: `POST/GET/PATCH/DELETE /api/projects`.

* **Tasks**

  * Tasks live inside projects and belong to the project owner.
  * Fields: title, description, status (`todo|doing|done`), priority (`low|normal|high`), tags, optional `startAt` / `dueAt`, `allDay`.
  * Endpoints:

    * `POST /api/projects/{projectId}/tasks`
    * `GET /api/projects/{projectId}/tasks`
    * `GET /api/tasks/{id}`
    * `PATCH /api/tasks/{id}`
  * Filters for list endpoint: `status`, `priority`, `tag`, `q` (search in title), `dueFrom`, `dueTo`, `limit`, `offset`.

* **Calendar**

  * `GET /api/calendar` — returns calendar events based on tasks that have `startAt` and/or `dueAt` in the given range.
  * Query params: `from`, `to` (required ISO datetimes), `projectId` (optional).
  * Regular users see events only from their own projects; **superadmin** can see all.

* **Boards (Kanban)**

  * `GET /api/boards/{projectId}` — returns a Kanban-style view for a single project.
  * Response shape:

    ```jsonc
    {
      "columns": [
        { "id": "todo",  "name": "To Do",  "tasks": [...] },
        { "id": "doing", "name": "Doing", "tasks": [...] },
        { "id": "done",  "name": "Done",  "tasks": [...] }
      ]
    }
    ```
  * Tasks are grouped by `status` and sorted by `updatedAt` (newest first inside each column).

* **Validation & Errors**

  * Zod schemas for requests and responses.
  * `validate()` middleware parses `body`, `query`, and `params`.
  * Central error handler, Zod-aware `400` responses, consistent JSON error shape.

* **Docs**

  * OpenAPI v3 generated from Zod schemas.
  * Swagger UI: `GET /api/docs`.
  * OpenAPI JSON: `GET /api/openapi.json`.

* **Tests**

  * Integration tests with Vitest + Supertest + mongodb-memory-server.
  * Cover auth, users, projects, tasks, calendar, and boards.

---

## Quick API Overview

Base URL for all endpoints is `/api`.

Main groups:

* `/api/auth/...` — authentication.
* `/api/users` — user creation (superadmin only).
* `/api/projects...` — project CRUD.
* `/api/projects/{projectId}/tasks` and `/api/tasks/{id}` — tasks.
* `/api/calendar` — calendar events derived from tasks.
* `/api/boards/{projectId}` — Kanban board for a project.

For full details (schemas, responses, error codes), see Swagger UI at `/api/docs`.

---

## Environment

Environment variables (read via `dotenv`):

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

Notes:

* After the first successful bootstrap, disable it in production:

  * set `ALLOW_BOOTSTRAP=false` and/or remove `BOOTSTRAP_*`.
* If you use cookies or Authorization headers from the browser, set `CORS_ORIGIN` to your frontend origin, not `*`.

---

## Local Development

### With Node

```bash
# in backend/
npm ci
npm run dev
```

Requires a running MongoDB instance at `MONGO_URI`. Quick local Mongo with Docker:

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

Use `infra/docker-compose.dev.yml` at the repo root. It brings up Mongo, backend, and Caddy.

---

## Testing

Run all integration tests:

```bash
# in backend/
npm test
```

To run a single test file, for example auth tests:

```bash
npx vitest run src/features/auth/auth.test.ts
```

`NODE_ENV=test` disables noisy request logging during tests.

---

## Project Structure (high level)

```text
backend/
├── src/
│   ├── app.ts          # Express app wiring (middlewares, routes, Swagger, errors)
│   ├── server.ts       # Entry point (Mongo connect, bootstrap, listen)
│   ├── common/         # auth, validate, asyncHandler, error handler
│   ├── config/         # env parsing, logger
│   ├── db/             # Mongo connection helper
│   ├── docs/           # OpenAPI registry + Swagger mounting
│   └── features/       # auth, users, projects, tasks, calendar, boards, tests
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

---

## License

This backend is licensed under the **GNU Affero General Public License v3.0 (AGPLv3)**.

See the `LICENSE` file in the repository for full details.
