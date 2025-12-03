# Changelog

All notable changes to this project will be documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

* **Frontend architecture**:

  * Introduced the target `frontend/` structure with clear separation into `app/`, `features/`, `shared/`, and `test/`.
  * `App.tsx` now wraps the app with `QueryProvider`, `AuthProvider`, and `RootLayout`, and uses a centralized `AppRouter`.
  * Implemented `RootLayout`, `AuthLayout`, and `MainLayout` for consistent page structure.
  * Added placeholder pages: `LoginPage`, `ProjectsPage`, `ProjectTasksPage`, `BoardPage`, `CalendarPage`.
  * Added shared UI primitives: `Button`, `Input`, `Card`, `Spinner`, `EmptyState`.

* **Frontend auth flow**:

  * Implemented `shared/lib/env.ts` with `getApiBaseUrl()` and `vite-env.d.ts` typing for `import.meta.env`.
  * Implemented `shared/lib/api-client.ts` (`apiClient`, `ApiError`) with automatic base URL, JSON handling, `Authorization` header from in-memory token, and `credentials: 'include'`.
  * Extended `shared/lib/auth-storage.ts` to hold an in-memory `accessToken` and `AuthUser` type.
  * Added `features/auth/api.ts` with `login`, `refresh`, `me`, and `logout` functions that talk to `/api/auth/*` endpoints.
  * Added `features/auth/hooks.ts` with `useLoginMutation()` that:

    * calls `POST /api/auth/login`;
    * then `GET /api/auth/me`;
    * on success, calls `login(me, accessToken)` from `useAuth`.
  * Implemented `AuthContext` and `useAuth()` in `app/hooks/useAuth.ts` with:

    * `user: Me | null`;
    * `status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated'`;
    * methods `login(user, accessToken)`, `logout()`, `refreshSession()`.
  * Implemented `AuthProvider` which on mount:

    * sets `status = 'loading'`;
    * calls `POST /api/auth/refresh`;
    * on success, stores `accessToken` and calls `GET /api/auth/me`;
    * on 401 or error, clears `accessToken` / `user` and sets `status = 'unauthenticated'`.
  * Implemented `AuthGuard` that:

    * shows a centered `Spinner` while `status` is `idle` or `loading`;
    * redirects to `/login` when `status` is `unauthenticated` or `user` is `null`;
    * otherwise renders children.
  * `MainLayout` now displays the current user (email / displayName) in the header and provides a `Logout` button that calls `POST /api/auth/logout` and resets the auth state.
  * `LoginForm` now:

    * validates `email` and `password` via Zod;
    * shows field-level validation errors;
    * on submit, calls `useLoginMutation`, and on success navigates to `/projects`;
    * shows a friendly error message for 401 (`"Неверный логин или пароль"`) and a generic error for other failures.

* **Frontend routing**:

  * `AppRouter` now uses `AuthGuard` for all private routes and composes them under a shared `MainLayout` + `Outlet`:

    * `/login` → `AuthLayout + LoginPage` (public);
    * `/` → redirect to `/projects` (private, behind `AuthGuard`);
    * `/projects` → `ProjectsPage` (private);
    * `/projects/:projectId/tasks` → `ProjectTasksPage` (private);
    * `/projects/:projectId/board` → `BoardPage` (private);
    * `/calendar` → `CalendarPage` (private);
    * `*` → redirect to `/projects`.

* **Testing for auth flow**:

  * `renderWithProviders` helper under `src/test/utils` to render components with `QueryProvider` and `AuthProvider`.
  * `LoginForm.test.tsx` covering:

    * form rendering and successful login path (mocked API + `navigate`);
    * validation errors for invalid email/password;
    * error messages for 401 and generic failures.
  * `AuthProvider.test.tsx` covering:

    * successful `refresh` on mount → `status = 'authenticated'`, `user` is set, `accessToken` stored;
    * `401` on `refresh` → `status = 'unauthenticated'`, `user` is `null`, token cleared.
  * `AuthGuard.test.tsx` covering:

    * loading state → shows `Spinner`;
    * unauthenticated → redirects to `/login`;
    * authenticated → renders children.
  * `App.test.tsx` updated to:

    * mock `authApi.refresh` + `authApi.me` to simulate an authenticated session;
    * assert that the root layout and main content render correctly.

* **Frontend projects & layout integration**:

  * Implemented the real projects feature in the frontend around the `/api/projects` endpoints: `features/projects/api.ts`, `features/projects/hooks.ts`, `ProjectsPage.tsx`, `ProjectCreateForm.tsx`, and `ProjectsSidebar.tsx`.
  * The `/projects` page now shows the current user's projects as cards with a color dot, creation date, inline rename + color picker, and a destructive delete action with confirmation.
  * The left sidebar inside `MainLayout` renders the same list of projects with an active highlight for the currently selected project and uses the project color as an indicator.
  * Projects can be created both from the main `/projects` page and directly from the sidebar via a compact "New project" form; both code paths share the same `ProjectCreateForm` component.

* **Frontend UI building blocks**:

  * Added `PageHeader` for consistent page-level titles/descriptions and actions.
  * Added `ErrorBanner` for concise error messaging with an optional "Retry" action, used across the projects views.

* **Frontend project guards**:

  * Introduced `app/RequireProjects.tsx` to guard project-dependent routes.
  * `RequireProjects` uses `useProjectsQuery()` and:

    * shows a loading state while projects are being fetched;
    * lets `/projects` render even when there are no projects;
    * for project-specific routes and the calendar view, shows an inline empty-state CTA when the user has no projects yet and provides a shortcut back to `/projects`.
  * This prevents users from landing on `/projects/:projectId/tasks`, `/projects/:projectId/board`, or `/calendar` via manual URL entry when they do not have any projects.

### Changed

* Frontend routing was refactored so all private routes share a common `AuthGuard` + `MainLayout` wrapper, reducing duplication and ensuring consistent auth checks.

* Local dev setup updated so that:

  * `npm run dev` uses Vite dev server with a proxy to `http://localhost:8080/api` for `/api` requests;
  * Dockerized frontend (Nginx) can be built with a `VITE_API_BASE_URL` environment variable for talking to a running backend.

* Nginx configuration split into `nginx.dev.conf` (no aggressive caching) and `nginx.prod.conf` (cache-busting for static assets) to avoid stale bundles during development and still benefit from caching in production.

* **Frontend layout & projects UX**:

  * `MainLayout` now derives the current project from `useProjectsQuery()` combined with route params and query string (`projectId` and `?projectId=`) and displays the **project name** and color indicator in the header instead of the raw project id.
  * The header now includes a prominent "← All projects" secondary button that navigates back to `/projects` from any project-specific view.
  * The overall layout uses `h-screen` with split scrolling: the sidebar and the main content scroll independently, and the "+ New project" button in the sidebar stays visible even with long project lists.
  * On `/projects`, the "New project" form is centered with a fixed max width, regardless of whether any projects already exist; when the list is empty, the empty state no longer renders a duplicate "Create project" button — the form itself is the primary call to action.

* **Frontend auth & token refresh**:

  * `shared/lib/api-client.ts` now performs **automatic access-token refresh** on `401` responses for non-auth endpoints by calling `POST /api/auth/refresh`, updating the in-memory access token, and retrying the original request once.
  * If the refresh request itself fails with `401`/`403` or the refresh cookie is missing/expired, the client clears the in-memory token and performs a hard redirect to `/login`, so stale tabs do not stay on broken private pages.
  * This keeps the existing `AuthProvider` behavior (initial refresh on mount) but makes token expiry transparent during normal usage and fails fast to the login screen when the session can no longer be recovered.

* **Route-level project requirements**:

  * The router now wraps project tasks, board, and calendar routes with `RequireProjects`:

    * `/projects/:projectId/tasks`;
    * `/projects/:projectId/board`;
    * `/calendar` (optionally scoped by `?projectId=`).
  * This ensures these views only render when the current user has at least one project and provides a clear "Create your first project" path otherwise.

### Technical (for devs)

* `shared/lib/env.ts`:

  * `getApiBaseUrl()` reads `import.meta.env.VITE_API_BASE_URL`, trims it, strips trailing slashes, and falls back to `/api`.
  * `vite-env.d.ts` declares the `ImportMetaEnv` shape with a typed `VITE_API_BASE_URL`.

* `shared/lib/api-client.ts`:

  * `apiClient<T>()` wraps `fetch` with:

    * base URL resolution via `getApiBaseUrl()`;
    * automatic JSON serialization/deserialization;
    * `Authorization: Bearer <accessToken>` header when a token is present in `auth-storage`;
    * `credentials: 'include'` so that refresh cookies are sent automatically;
    * `ApiError` thrown for non-OK responses with attached `status` and parsed payload.
  * It now also:

    * intercepts `401` responses for non-auth endpoints, calls `/api/auth/refresh`, updates the in-memory access token, and retries the original request once;
    * on refresh failure (missing/expired cookie or `401/403`), clears auth state and redirects the browser to `/login` to force an explicit re-authentication.

* `shared/lib/auth-storage.ts`:

  * keeps `accessToken` in a module variable (in-memory only, no localStorage/cookies);
  * exports `setAccessToken()` / `getAccessToken()` and `AuthUser` type aliased to backend `Me` shape.

* `app/hooks/useAuth.ts`:

  * defines `AuthStatus` union and `AuthContextValue` interface;
  * exports a strongly-typed `useAuth()` hook that throws if used outside `AuthProvider`.

* `app/providers/AuthProvider.tsx`:

  * orchestrates `refresh()` + `me()` calls on mount via `useEffect`;
  * handles all branches of the auth state machine: `idle` → `loading` → `authenticated` / `unauthenticated`;
  * exposes `login`, `logout`, and `refreshSession` to the rest of the app.

* `app/AuthGuard.tsx`:

  * centralizes access control logic for private routes (loading → spinner, unauthenticated → redirect, authenticated → children).

* `features/auth/api.ts` and `features/auth/hooks.ts`:

  * encapsulate all auth-related HTTP calls and React Query mutations/flows, keeping components thin.

* Frontend tests:

  * use Vitest + Testing Library with `jsdom` and `@testing-library/jest-dom` from `setupTests.ts`;
  * mock `react-router-dom` navigation and `features/auth/api` functions where needed to simulate backend behavior.

* `app/RequireProjects.tsx`:

  * centralizes the "you must have at least one project" rule for project-specific and calendar routes;
  * reuses `useProjectsQuery()` so the projects list and sidebar stay in sync;
  * renders a simple loading state and an `EmptyState` with a CTA to go to `/projects` and create the first project when needed.

* `features/projects/*`:

  * `features/projects/api.ts` and `features/projects/hooks.ts` encapsulate HTTP calls and React Query hooks for `/api/projects`.
  * `ProjectsPage.tsx` implements the main projects screen with the create form and project cards (rename, color, delete).
  * `components/ProjectCreateForm.tsx` and `components/ProjectsSidebar.tsx` provide reusable project creation and navigation UI.
  * `ProjectsPage.test.tsx` is scaffolded as a starting point for projects-related tests.

* `shared/ui`:

  * `PageHeader.tsx` standardizes page titles and descriptions across screens.
  * `ErrorBanner.tsx` encapsulates inline error display with an optional retry callback.

---

## v0.1.7 - 2025-11-25

### Added

* **Projects**: you can now create projects, list your own, rename, and delete them.
* **Permissions**: each user can see and manage only their own projects; the **superadmin** can manage any project.
* **Docs**: a **Projects** section is available in `/api/docs`.
* **Tasks**: you can now create tasks inside a project, list them, and update them.
* **Task filters**: tasks can be filtered by status, priority, tag, search query (`q`), and due date range (`dueFrom`/`dueTo`), with pagination via `limit`/`offset`.
* **Task endpoints**: added `POST /api/projects/{projectId}/tasks`, `GET /api/projects/{projectId}/tasks`, `GET /api/tasks/{id}`, and `PATCH /api/tasks/{id}`.
* **Calendar**: added `GET /api/calendar` to return calendar events based on tasks that have `startAt` and/or `dueAt` within a given date range.
* **Calendar filters**: calendar supports an optional `projectId` filter; regular users see events only from their own projects, while the **superadmin** can see events from all projects.
* **Docs**: a **Calendar** section is available in `/api/docs`.
* **Boards**: added `GET /api/boards/{projectId}` to return a Kanban-style board for a project, grouping tasks into `todo`, `doing`, and `done` columns.
* **Docs**: a **Boards** section is available in `/api/docs`.
* **Frontend scaffold**: React + Vite + TypeScript frontend app with Tailwind CSS v4, React Query, and a minimal App component + test.
* **Frontend tooling**: Vitest + Testing Library + `@testing-library/jest-dom` for React testing, ESLint + Prettier setup for the frontend.
* **Frontend CI**: `frontend-ci` GitHub Actions workflow running lint, typecheck, tests, and build for the `frontend/` directory.
* **Frontend Docker image**: Nginx-based Dockerfile for the frontend that serves the built SPA.

### Changed

* OpenAPI: added the **Projects** tag and promoted request/response schemas to named components.
* OpenAPI: added the **Tasks** tag and documented all task-related endpoints and schemas.
* OpenAPI: added the **Calendar** tag and documented calendar query and event schemas.
* OpenAPI: added the **Boards** tag and documented the board endpoint and response schemas.
* Release pipeline: the `Release & Deploy` workflow now builds and pushes **both** backend and frontend images to GHCR and deploys them together.
* Production infra: `docker-compose.prod.yml` and `Caddyfile` updated so that:

  * `todo-frontend` serves the SPA on `/`,
  * `/api/*` requests are reverse-proxied to `todo-backend` via Caddy.

### Technical (for devs)

* Mongoose `Project` model with `{ ownerId: 1 }` index and `timestamps`.
* Zod schemas registered as OpenAPI components: `CreateProjectBody`, `UpdateProjectBody`, `ProjectResponse`, `ProjectIdParam`.
* Integration tests (Vitest + Supertest + mongodb-memory-server) cover CRUD and authorization rules for projects.
* Mongoose `Task` model with indexes `{ projectId: 1, status: 1, updatedAt: -1 }`, `{ projectId: 1, dueAt: 1 }`, and `timestamps`.
* Zod schemas registered as OpenAPI components for tasks: `TaskStatus`, `TaskPriority`, `TaskIdParam`, `ProjectTasksParam`, `CreateTaskBody`, `UpdateTaskBody`, `ListTasksQuery`, `TaskResponse`.
* Integration tests (Vitest + Supertest + mongodb-memory-server) cover task CRUD, filters, pagination, and access control.
* Zod schemas registered as OpenAPI components for calendar: `CalendarQuery`, `CalendarEvent`.
* Calendar integration: `GET /api/calendar` reuses task and project access rules (owner vs superadmin) and is covered by integration tests (range filtering, project-level access control, and ownership checks).
* Zod schemas registered as OpenAPI components for boards: `BoardProjectParam`, `BoardColumn`, `BoardResponse`.
* Boards integration: `GET /api/boards/{projectId}` reuses project access rules and is covered by integration tests (grouping by status, sort order by `updatedAt`, and access control for owner/superadmin/other users).
* Frontend config:

  * Vite + React + TypeScript with `tsconfig.app.json` / `tsconfig.test.json` split.
  * Vitest config with `jsdom` environment and `setupTests.ts` wiring `@testing-library/jest-dom`.
  * Flat ESLint config for the frontend with React, hooks, import, unused-imports, and Prettier integration.
* CI:

  * `backend-ci` runs lint, typecheck, tests, build, and Docker build for the backend.
  * `frontend-ci` runs lint, typecheck, tests, and Vite build for the frontend.
* Release pipeline:

  * `release.yaml` resolves backend/frontend image names (`todo-backend` / `todo-frontend`), builds and pushes both images with `vX.Y.Z` and `latest` tags, and then triggers deployment over SSH to the production server.

---

## v0.1.6 - 2025-11-06

### Added

* `docker-compose.dev.yml`.
* `docker-compose.prod.yml`.
* Access & refresh token support.
* Error handling via **Zod**.
* Request/response validation via **Zod**.
* OpenAPI generator and Swagger UI (available at `/api/docs` and `/api/openapi.json`).
* Auth routes: `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/me`.
* Body validation for `/api/auth/login` (Zod).
* `asyncHandler` wrapper for safe controller error handling.
* User creation route: `POST /api/users` (superadmin only).
* Superadmin bootstrap via `ALLOW_BOOTSTRAP` and `BOOTSTRAP_*` environment variables.
* Integration tests: superadmin login → create user → user login → creation forbidden.
* OpenAPI for Auth and Users with correct security (login/refresh/logout do **not** require Bearer; others do).

### Changed

*

### Fixed

*
