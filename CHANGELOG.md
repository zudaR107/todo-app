# Changelog

All notable changes to this project will be documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

### Changed

* OpenAPI: added the **Projects** tag and promoted request/response schemas to named components.
* OpenAPI: added the **Tasks** tag and documented all task-related endpoints and schemas.
* OpenAPI: added the **Calendar** tag and documented calendar query and event schemas.
* OpenAPI: added the **Boards** tag and documented the board endpoint and response schemas.

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
