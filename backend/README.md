# todo-backend

Backend for the personal Todo application. Node.js + Express + TypeScript, MongoDB (Mongoose), JWT auth (access + httpOnly refresh cookie), Zod validation, and OpenAPI/Swagger.

> **Registration policy:** Only a **superadmin** can create users. There is no public register endpoint.

---

## Features

* **Auth:** JWT access tokens, httpOnly **refresh** cookie, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`.
* **RBAC:** `authGuard` + `requireRole('superadmin')` middleware.
* **Admin-only users:** `POST /api/users` creates users and is restricted to superadmin.
* **Validation:** Zod schemas for requests/responses; runtime validation + shared types.
* **Docs:** OpenAPI v3 with Swagger UI at `/api/docs`, JSON at `/api/openapi.json`.
* **Error handling:** Central error middleware, Zod-aware 400s, consistent JSON.
* **Bootstrap:** Optional one-time superadmin seeding via env flags.
* **Tests:** Vitest + Supertest + mongodb-memory-server integration tests.

---

## API Overview

Base URL is `/api`.

### Auth

* `POST /api/auth/login` → `{ accessToken, user }` + sets `refresh_token` httpOnly cookie.
* `POST /api/auth/refresh` → `{ accessToken }` (reads `refresh_token` cookie).
* `POST /api/auth/logout` → `204 No Content` and clears `refresh_token` cookie.
* `GET /api/auth/me` → current user (requires **Bearer** access token).

### Users (admin-only)

* `POST /api/users` → create user (superadmin only).

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
> * set `ALLOW_BOOTSTRAP=false` and/or remove `BOOTSTRAP_*`.

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

Test entry example: `src/features/auth/auth.test.ts` covers

* superadmin login → create user → user login → forbidden create
* absence of public register route

To run a single test file:

```bash
npx vitest run src/features/auth/auth.test.ts
```

To reduce logs during tests, `NODE_ENV=test` disables request logging.

---

## Project Structure (backend)

```
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
│   │   │   ├── auth.schemas.ts    # Zod schemas (Role, LoginBody, MeResponse, LoginResponse)
│   │   │   ├── auth.controller.ts # login/refresh/logout/me controllers
│   │   │   └── auth.routes.ts     # routes + OpenAPI path registration
│   │   └── users/
│   │       ├── user.model.ts      # Mongoose User schema (hashes password)
│   │       ├── users.schemas.ts    # Zod schemas (CreateUserBody, UserResponse)
│   │       ├── users.controller.ts # create user (superadmin only)
│   │       └── users.routes.ts     # routes + OpenAPI path registration
│   └── features/**/ *.test.ts      # integration tests
├── Dockerfile
├── eslint.config.js
├── package.json
├── tsconfig.json
└── README.md (this file)
```

---

## Middleware & Errors

* `authGuard` reads `Authorization: Bearer <token>` and attaches `req.user`.
* `requireRole('superadmin')` enforces admin-only endpoints.
* `validate({ body/query/params })` parses parts of the request via Zod; on fail returns 400 with details.
* Centralized `errorHandler` returns JSON; Zod errors get a structured `details` field.

---

## OpenAPI / Swagger

* We use [`@asteasolutions/zod-to-openapi`](https://github.com/asteasolutions/zod-to-openapi) to derive OpenAPI from Zod schemas and route registrations.
* Access via:

  * **UI**: `GET /api/docs`
  * **JSON**: `GET /api/openapi.json`
* Global `bearerAuth` security is enabled, but `/auth/login`, `/auth/refresh`, `/auth/logout` explicitly override it (no bearer required).

---

## Deployment (overview)

* CI builds/pushes Docker images to GHCR on tag push `v*`.
* CD deploys to your server via SSH and `docker-compose.prod.yml` (Mongo + backend + Caddy).
* Backend image: `ghcr.io/<owner>/todo-backend:<tag>` and `:latest`.

> See `.github/workflows/release.yml` and `infra/` for details.

---

## Security Notes

* Rotate `JWT_*_SECRET` for production; keep them out of VCS.
* Keep `ALLOW_BOOTSTRAP=false` in production after initial admin creation.
* Use HTTPS (Caddy handles TLS) and limit `CORS_ORIGIN` to your frontend origin when cookies are used.

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
