# todo-frontend

Frontend for a personal Todo application.

- React + TypeScript + Vite (SPA)
- Tailwind CSS v4 for styling
- React Router for routing
- React Query for data fetching/cache
- Auth flow integrated with the backend JWT API (access token + httpOnly refresh cookie)
- Vitest + React Testing Library for tests

---

## Features

### Auth & Session Handling

The frontend talks to the backend auth endpoints:

- `POST /api/auth/login` — login with email/password; backend sets httpOnly refresh cookie.
- `POST /api/auth/refresh` — uses refresh cookie to obtain a new access token.
- `GET  /api/auth/me` — returns the current user.
- `POST /api/auth/logout` — clears the refresh cookie.

Frontend behavior:

- Access token is stored **in memory only** via `shared/lib/auth-storage.ts`.
- `AuthProvider` keeps:
  - `user: Me | null` — current user info.
  - `status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated'`.

- On mount, `AuthProvider`:
  1. Sets `status = 'loading'`.
  2. Calls `POST /api/auth/refresh` (with `credentials: 'include'`).
  3. On success: saves `accessToken`, calls `GET /api/auth/me`, sets `user` and `status = 'authenticated'`.
  4. On 401 or error: clears token and user, sets `status = 'unauthenticated'`.

- `AuthGuard` protects private routes:
  - While `status` is `idle | loading` → shows centered spinner.
  - If `status = 'unauthenticated'` or `user` is null → redirect to `/login`.
  - Otherwise → renders children.

Login:

- `/login` route renders `AuthLayout + LoginPage`.
- `LoginForm`:
  - Fields: `email`, `password`.
  - Client-side validation via **Zod**.
  - Uses `useLoginMutation()` (React Query + `AuthProvider.login`):
    1. `POST /api/auth/login`.
    2. On success, calls `GET /api/auth/me`.
    3. Updates `AuthProvider` state.
    4. Navigates to `/projects`.

  - On `401` → shows "Неверный логин или пароль".
  - On other errors → shows a generic error message.

Logout:

- Logout button is available in the `MainLayout` topbar on private pages.
- Calls `POST /api/auth/logout`, then clears access token and user in `AuthProvider` and redirects the user to the login flow (via `AuthGuard`).

### Routing & Layout

Routing is implemented with `react-router-dom`:

- Public route:
  - `/login` — login page (`AuthLayout + LoginPage`).

- Private routes (wrapped in `AuthGuard` + `MainLayout`):
  - `/` → redirects to `/projects`.
  - `/projects` — placeholder page for the list of projects.
  - `/projects/:projectId/tasks` — placeholder page for project tasks.
  - `/projects/:projectId/board` — placeholder page for Kanban board.
  - `/calendar` — placeholder page for calendar view.
  - `*` → redirects to `/projects`.

Layout components:

- **`RootLayout`** — global background, font, and basic shell.
- **`AuthLayout`** — centered card layout for `/login`.
- **`MainLayout`** — application shell for authenticated users:
  - Left sidebar (currently a stub; projects list will be added later).
  - Topbar with app title and current user display name / email + Logout button.
  - Main content area for pages.

### UI Components (shared)

Reusable UI components implemented so far:

- `Button` — primary button component used across auth and layout.
- `Input` — styled text input for forms.
- `Card` — container for panels / sections.
- `Spinner` — loading indicator.
- `EmptyState` — placeholder for empty lists / states (currently used as building block for future pages).

All styling is done via **Tailwind CSS v4** with a dark theme and accent colors configured in `index.css` and the shared UI components.

### HTTP Client & Config

- `shared/lib/env.ts`:
  - `getApiBaseUrl()` — resolves API base URL from `import.meta.env.VITE_API_BASE_URL` or falls back to `'/api'`.

- `shared/lib/api-client.ts`:
  - Wraps `fetch` with:
    - automatic `Accept: application/json` header;
    - JSON request bodies when `options.body` is provided;
    - `Authorization: Bearer <accessToken>` header if a token is available in `auth-storage`;
    - `credentials: 'include'` to send cookies (refresh token);
    - `ApiError` thrown on non-2xx responses with `status` and `data`.

- `shared/lib/auth-storage.ts`:
  - In-memory access token storage (`setAccessToken`, `getAccessToken`).

Backend base URL:

- By default, frontend expects backend under `/api` relative to the origin (e.g. `http://localhost:8080/api` behind a reverse proxy).
- For Docker/Nginx, you can set:

  ```bash
  VITE_API_BASE_URL="http://localhost:8080/api"
  ```

  at build time, so the static build uses the correct backend address.

### Tests

Tests are written with **Vitest** and **React Testing Library** (`jsdom` environment).

Currently covered:

- `AuthProvider` behavior (refresh on mount, auth/unauth states).
- `AuthGuard` logic (loading spinner, redirect to `/login`, rendering private content).
- `LoginForm` behavior:
  - form rendering;
  - client-side validation errors;
  - successful login flow (mocked API);
  - invalid credentials (`401`) error handling.

- `App` root component:
  - basic render under providers;
  - integration of router + auth context in tests via `renderWithProviders`.

---

## Local Development

### With Vite Dev Server

From the `frontend/` directory:

```bash
# install dependencies
npm ci

# run dev server (Vite)
npm run dev
```

By default, Vite serves the app at `http://localhost:5173`.

Backend options:

- **Option 1:** Run backend separately on `http://localhost:8080` and use Vite dev proxy to forward `/api` to the backend (configured in `vite.config.ts`).
- **Option 2:** Use the `infra/docker-compose.dev.yml` stack at the repo root to start `mongo + backend + Caddy`, and point the frontend to `/api` proxied by Caddy.

### With Docker (frontend only)

Build the dev image (static build + Nginx):

```bash
# in frontend/
VITE_API_BASE_URL="http://localhost:8080/api" docker build -t todo-frontend:dev .
```

Run the container:

```bash
# serve SPA on http://localhost:4173
docker run --rm -p 4173:80 todo-frontend:dev
```

Make sure the backend is available at the URL you set in `VITE_API_BASE_URL` (for example, `http://localhost:8080/api`).

### With docker-compose (dev stack)

At the repo root, the `infra/docker-compose.dev.yml` file can bring up a full dev stack (Mongo, backend, frontend, Caddy). See the root `README.md` for details.

---

## Testing

From the `frontend/` directory:

```bash
# run all tests
npm test
```

Vitest is configured with:

- `jsdom` environment for React.
- `setupTests.ts` wiring `@testing-library/jest-dom`.
- `renderWithProviders` helper to wrap components in `QueryProvider` + `AuthProvider` + `BrowserRouter` during tests.

---

## Project Structure (high level)

```text
frontend/
├── src/
│   ├── app/
│   │   ├── App.tsx              # Root component
│   │   ├── App.test.tsx         # Basic app tests
│   │   ├── router.tsx           # React Router setup
│   │   ├── routes.ts            # Route constants/helpers
│   │   ├── AuthGuard.tsx        # Guard for private routes
│   │   ├── AuthGuard.test.tsx   # AuthGuard tests
│   │   ├── hooks/
│   │   │   └── useAuth.ts       # Auth context hook + types
│   │   ├── providers/
│   │   │   ├── AuthProvider.tsx       # Auth state + refresh/login/logout
│   │   │   ├── AuthProvider.test.tsx  # AuthProvider tests
│   │   │   └── QueryProvider.tsx      # React Query client provider
│   │   └── layout/
│   │       ├── RootLayout.tsx   # Global app shell
│   │       ├── AuthLayout.tsx   # Layout for login
│   │       └── MainLayout.tsx   # Layout for authenticated area
│   ├── features/
│   │   ├── auth/
│   │   │   ├── api.ts           # login/refresh/me/logout API calls
│   │   │   ├── hooks.ts         # useLoginMutation, useMeQuery
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx       # Login form component
│   │   │   │   └── LoginForm.test.tsx  # Login form tests
│   │   │   └── pages/
│   │   │       └── LoginPage.tsx       # Login page
│   │   ├── projects/
│   │   │   └── pages/
│   │   │       └── ProjectsPage.tsx    # Placeholder
│   │   ├── tasks/
│   │   │   └── pages/
│   │   │       └── ProjectTasksPage.tsx # Placeholder
│   │   ├── board/
│   │   │   └── pages/
│   │   │       └── BoardPage.tsx        # Placeholder
│   │   └── calendar/
│   │       └── pages/
│   │           └── CalendarPage.tsx     # Placeholder
│   ├── shared/
│   │   ├── lib/
│   │   │   ├── api-client.ts    # Fetch wrapper with auth + JSON handling
│   │   │   ├── auth-storage.ts  # In-memory access token
│   │   │   ├── cn.ts            # Class name helper (clsx + tailwind-merge)
│   │   │   └── env.ts           # VITE_API_BASE_URL resolver
│   │   ├── types/
│   │   │   └── api.ts           # Shared API types (Me, Project, Task, etc.)
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── EmptyState.tsx
│   │       ├── Input.tsx
│   │       └── Spinner.tsx
│   ├── test/
│   │   └── utils/
│   │       └── renderWithProviders.tsx  # Wraps components in providers for tests
│   ├── index.css              # Tailwind CSS entry + global styles
│   ├── main.tsx               # Vite entry point (ReactDOM.createRoot)
│   ├── setupTests.ts          # Vitest + RTL setup
│   └── vite-env.d.ts
├── Dockerfile                 # Nginx-based Dockerfile for SPA
├── nginx.dev.conf             # Nginx config for dev-like container
├── nginx.prod.conf            # Nginx config for production container
├── vite.config.ts             # Vite config (React, Tailwind, dev proxy)
└── vitest.config.ts           # Vitest config (jsdom, setup file)
```

---

## License

This frontend is licensed under the **GNU Affero General Public License v3.0 (AGPLv3)**, same as the rest of the project.

See the `LICENSE` file in the repository for full details.
