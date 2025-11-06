# Changelog

All notable changes to this project will be documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

*

### Changed

*

### Fixed

*

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

---

## v0.1.5 - 2025-10-16

### Added

*

### Changed

*

### Fixed

*
