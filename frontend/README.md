# todo-frontend

Frontend for a personal Todo application.

- React + TypeScript + Vite (SPA)
- Tailwind CSS v4 for styling
- React Router for routing
- React Query for data fetching/cache
- Auth flow integrated with the backend JWT API (access token + httpOnly refresh cookie)
- Vitest + React Testing Library for tests
- Minimalist dark UI with project-based navigation (projects list already implemented)

---

## Features

### Auth & Session Handling

The frontend talks to the backend auth endpoints:

- `POST /api/auth/login` — login with email/password; backend sets httpOnly refresh cookie.
- `POST /api/auth/refresh` — uses refresh cookie to obtain a new access token.
- `GET  /api/auth/me` — returns the current user.
- `POST /api/auth/logout` — clears the refresh cookie.

Frontend behavior:

- Access token is stored **in memory only** via `shared/lib/auth-storage.ts` (no `localStorage`, no cookies).
- `AuthProvider` keeps:
  - `user: Me | null` — current user info.
  - `status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated'`.

Initial session restore:

- On mount, `AuthProvider`:
  1. Sets `status = 'loading'`.
  2. Calls `POST /api/auth/refresh` (with `credentials: 'include'`).
  3. On success: saves `accessToken`, calls `GET /api/auth/me`, sets `user` and `status = 'authenticated'`.
  4. On `401` or error: clears token and user, sets `status = 'unauthenticated'`.

Protected routes:

- `AuthGuard` protects private routes:
  - While `status` is `idle | loading` → shows centered spinner.
  - If `status = 'unauthenticated'` or `user` is `null` → redirect to `/login` (optionally preserving the last location).
  - Otherwise → renders children.

Login:

- `/login` route renders `AuthLayout + LoginPage`.
- `LoginForm`:
  - Fields: `email`, `password`.

  - Client-side validation via **Zod**.

  - Uses `useLoginMutation()` (React Query + `AuthProvider.login`):
    1. `POST /api/auth/login`.
    2. On success, calls `GET /api/auth/me`.
    3. Updates `AuthProvider` state (`user` + `accessToken`).
    4. Navigates to `/projects`.

  - On `401` → shows `Неверный логин или пароль`.

  - On other errors → shows a generic error message.

Logout:

- Logout button is available in the `MainLayout` topbar on private pages.
- Calls `POST /api/auth/logout`, then clears access token and user in `AuthProvider` and redirects the user to the login flow (via `AuthGuard`).

Automatic access token refresh on 401:

- `shared/lib/api-client.ts` now supports **automatic refresh**:
  - For regular API calls:
    - If a request returns `401` and it’s not the `/api/auth/refresh` call itself, `apiClient`:
      1. Tries `POST /api/auth/refresh`.
      2. On success, stores the new access token.
      3. Retries the **original** request once with a fresh `Authorization` header.

  - If refresh fails (e.g. no refresh cookie, `401` from `/api/auth/refresh`), a global auth error handler is invoked from `AuthProvider`:
    - clears access token and user;
    - marks the session as `unauthenticated`;
    - active private pages are naturally pushed back to `/login` by `AuthGuard`.

This means:

- If only the **access token** expired, requests will transparently re-authenticate.
- If the **refresh cookie** is gone (cleared manually / expired), the app will send the user back to the login page after the next failed request.

---

### Projects UI & Navigation

Projects are the first “real” domain feature implemented on the frontend.

#### `/projects` page

- Uses `features/projects/hooks.ts` (`useProjectsQuery`, `useUpdateProjectMutation`, `useDeleteProjectMutation`) to load and manage the current user’s projects.
- Centered **“New project”** card with a fixed max width (always visually consistent, whether there are projects or not):
  - Title + short description.
  - `ProjectCreateForm` with:
    - `name` field (required).
    - optional color picker (currently sidebar form supports color presets via the model; main form can be extended later).

- Below the form, a list of project cards (if any):

Each **project card** (`ProjectCard` inside `ProjectsPage`) includes:

- Colored dot (project color, or default green if not set).
- Project name (editable inline).
- Creation date label (“Создан …”).
- **Open** button:
  - Navigates to `/projects/:projectId/tasks` (task list for that project).

- Inline editing:
  - “Редактировать” → switches to edit mode.
  - Color picker (`input type="color"`) to update `project.color`.
  - “Сохранить” → `PATCH /api/projects/:id`.
  - “Отмена” → restores original name/color.

- Delete:
  - “Удалить” button with `window.confirm`.
  - `DELETE /api/projects/:id` on confirm.

- Status message explaining color usage (“Цвет используется как индикатор проекта…”).

Empty state:

- If there are **no projects**:
  - `/projects` shows:
    - Centered “New project” card.
    - Below it, `EmptyState`:
      - Title: “Проектов пока нет.”
      - Description: “Создайте первый проект, чтобы начать планировать задачи и видеть их в списке и на доске.”

    - No redundant “Create project” button here (to avoid duplicating the main form button).

Error and loading:

- While loading — skeleton cards + spinner message where appropriate.
- On error — `ErrorBanner` with a short message and a “Retry” button.

#### Sidebar: `ProjectsSidebar`

`ProjectsSidebar` (used inside `MainLayout`) turns projects into persistent navigation:

- Header block:
  - “todo-app” label.
  - “Мои проекты” title.
  - Short description that changes depending on whether projects exist.

- Scrollable projects list:
  - Container is a dashed bordered panel with `overflow-y-auto`.
  - List items:
    - Colored dot (project color).
    - Truncated project name.
    - Active project highlighted (based on URL `:projectId`).

  - Clicking a project:
    - If current pathname contains `/board` → navigates to `/projects/:projectId/board`.
    - Otherwise → navigates to `/projects/:projectId/tasks`.

- Inline create form:
  - Button `+ Новый проект` pinned at the bottom of the sidebar (always visible; project list scrolls inside its own container).
  - Clicking it toggles `ProjectCreateForm` (`variant="sidebar"`).
  - On successful creation:
    - Sidebar form hides.
    - User is navigated directly to `/projects/:newProjectId/tasks`.

#### MainLayout: topbar & views

`MainLayout` is the main shell for authenticated pages:

- **Layout:**
  - Full-height flex container (`h-screen`), with:
    - Left sidebar (desktop only) containing `ProjectsSidebar`.
    - Right area with:
      - Top header (fixed height).
      - Scrollable main content (`overflow-y-auto`).

- **Topbar contents:**
  - Left side:
    - Small colored dot:
      - Uses current project color when a project is active.
      - Uses default accent color otherwise.

    - Title:
      - “todo-app” on generic pages.
      - “Проекты” on `/projects`.
      - Project name on project-scoped pages (`/projects/:id/tasks`, `/projects/:id/board`).
      - “Календарь” on `/calendar`.

    - Subtitle:
      - For `/projects`: “Управляйте рабочими, личными и учебными проектами.” (now **only in topbar**, `ProjectsPage` no longer duplicates this text via `PageHeader`).
      - For project views: “Задачи, доска и календарь выбранного проекта.”
      - For `/calendar`: “Просмотр задач по датам начала и дедлайнам.”

    - **“← Все проекты” button**:
      - Visible whenever a project context is active.
      - Implemented as a proper `Button` (`variant="secondary"`) in the topbar, not as a small text link.
      - Navigates to `/projects`.

  - Right side:
    - Tabs for project views (visible only when a project is selected):
      - `Задачи` → `/projects/:projectId/tasks`.
      - `Доска` → `/projects/:projectId/board`.
      - `Календарь` → `/calendar?projectId=:projectId`.
      - Implemented as rounded pill buttons with active state highlighting.

    - User block:
      - “Пользователь: …” + display name / email (or “Проверяем сессию...” while auth is loading).
      - `Выйти` button that calls `logout()`.

---

### RequireProjects: guarding project-scoped pages

There is an additional guard `app/RequireProjects.tsx` used **in addition** to `AuthGuard`:

- Applied to:
  - `/projects/:projectId/tasks`
  - `/projects/:projectId/board`
  - `/calendar` (in project context)

Behavior:

1. Loads projects via `useProjectsQuery()`.
2. While loading — shows a centered spinner.
3. On error — shows `ErrorBanner` with a short message and a button to go back to `/projects`.
4. If the user has **no projects** yet:
   - Renders a friendly `EmptyState` explaining that at least one project is required.
   - Provides a button “Create first project” (or similar) that redirects to `/projects`.

5. If projects exist:
   - Renders `children` (the actual page: tasks, board, calendar).

This prevents navigation to `/projects/:id/…` or `/calendar` via manual URL typing when there are no projects, and gives the user a clear “go create a project first” path.

---

### Routing & Layout

Routing is implemented with `react-router-dom`.

Current routes:

- Public:
  - `/login` — login page (`AuthLayout + LoginPage`).

- Private (wrapped in `AuthGuard` + `MainLayout`):
  - `/`
    - Redirects to `/projects`.

  - `/projects`
    - **Real page**: projects list and “create project” form.

  - `/projects/:projectId/tasks`
    - Project tasks page (currently a placeholder for upcoming task list implementation).
    - Wrapped in `RequireProjects` to ensure at least one project exists.

  - `/projects/:projectId/board`
    - Project Kanban page (currently a placeholder).
    - Wrapped in `RequireProjects`.

  - `/calendar`
    - Calendar view (currently a placeholder).
    - Wrapped in `RequireProjects` (so it can later use `?projectId=` and still be protected by the “project required” logic).

  - `*`
    - Redirects to `/projects`.

Layout components:

- **`RootLayout`** — global background, font, and basic shell.
- **`AuthLayout`** — centered card layout for `/login`.
- **`MainLayout`** — application shell for authenticated users:
  - Left sidebar with live projects list (`ProjectsSidebar`) and “+ Новый проект” button fixed at the bottom.
  - Topbar with:
    - page/project title + subtitle,
    - project view tabs (tasks / board / calendar),
    - “All projects” button,
    - current user info + Logout button.

  - Main content area (scrollable) for pages.

---

### UI Components (shared)

Reusable UI components implemented so far (in `src/shared/ui`):

- `Button` — primary / secondary / ghost buttons used across the app.
- `Input` — styled text input for forms.
- `Card` — container for panels / sections.
- `Spinner` — loading indicator.
- `EmptyState` — placeholder for empty lists / states.
- `ErrorBanner` — compact error box with optional “Retry” action.
- `PageHeader` — generic header (title + description + optional actions) used on pages that need an internal header (currently `/projects` uses only the topbar, so `PageHeader` is available for future task/board/calendar layouts).

All styling is done via **Tailwind CSS v4** with a dark theme and accent colors configured in `index.css` and the shared UI components.

---

### HTTP Client & Config

- `shared/lib/env.ts`:
  - `getApiBaseUrl()` — resolves API base URL from `import.meta.env.VITE_API_BASE_URL` or falls back to `'/api'`.

- `shared/lib/api-client.ts`:
  - Wraps `fetch` with:
    - automatic `Accept: application/json` header;
    - JSON request bodies when `options.body` is provided;
    - `Authorization: Bearer <accessToken>` header if a token is available in `auth-storage`;
    - `credentials: 'include'` to send cookies (refresh token);
    - `ApiError` thrown on non-2xx responses with `status` and parsed `data`;
    - **automatic retry** once on `401` via `POST /api/auth/refresh` (see “Auth & Session Handling” above).

- `shared/lib/auth-storage.ts`:
  - In-memory access token storage (`setAccessToken`, `getAccessToken`).

Backend base URL:

- By default, frontend expects backend under `/api` relative to the origin (e.g. `http://localhost:8080/api` behind a reverse proxy).
- For Docker/Nginx, you can set:

  ```bash
  VITE_API_BASE_URL="http://localhost:8080/api"
  ```

  at build time, so the static build uses the correct backend address.

---

### Tests

Tests are written with **Vitest** and **React Testing Library** (`jsdom` environment).

Currently covered:

- `AuthProvider` behavior:
  - refresh on mount;
  - auth/unauth states;
  - storing/clearing access token.

- `AuthGuard` logic:
  - loading spinner;
  - redirect to `/login`;
  - rendering private content when authenticated.

- `LoginForm` behavior:
  - form rendering;
  - client-side validation errors;
  - successful login flow (mocked API);
  - invalid credentials (`401`) error handling;
  - generic error handling.

- `App` root component:
  - basic render under providers;
  - integration of router + auth context in tests via `renderWithProviders`.

- `ProjectsPage`:
  - basic rendering of the projects list and “New project” form (happy path, mocked API).
  - (More detailed tests for create/update/delete flows can be added incrementally.)

`renderWithProviders` (`src/test/utils/renderWithProviders.tsx`) is used to:

- wrap components in `QueryProvider` + `AuthProvider` + `BrowserRouter` for realistic integration tests;
- optionally mock auth state and API layer.

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
│   │   ├── App.tsx                 # Root component
│   │   ├── App.test.tsx            # Basic app tests
│   │   ├── router.tsx              # React Router setup
│   │   ├── routes.ts               # Route constants/helpers
│   │   ├── AuthGuard.tsx           # Guard for private routes
│   │   ├── AuthGuard.test.tsx      # AuthGuard tests
│   │   ├── RequireProjects.tsx     # Guard requiring at least one project
│   │   ├── hooks/
│   │   │   └── useAuth.ts          # Auth context hook + types
│   │   ├── providers/
│   │   │   ├── AuthProvider.tsx        # Auth state + refresh/login/logout
│   │   │   ├── AuthProvider.test.tsx   # AuthProvider tests
│   │   │   └── QueryProvider.tsx       # React Query client provider
│   │   └── layout/
│   │       ├── RootLayout.tsx      # Global app shell
│   │       ├── AuthLayout.tsx      # Layout for login
│   │       └── MainLayout.tsx      # Layout for authenticated area (sidebar + topbar)
│   ├── features/
│   │   ├── auth/
│   │   │   ├── api.ts              # login/refresh/me/logout API calls
│   │   │   ├── hooks.ts            # useLoginMutation, useMeQuery
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx        # Login form component
│   │   │   │   └── LoginForm.test.tsx   # Login form tests
│   │   │   └── pages/
│   │   │       └── LoginPage.tsx        # Login page
│   │   ├── projects/
│   │   │   ├── api.ts               # /api/projects* client
│   │   │   ├── hooks.ts             # useProjectsQuery + mutations
│   │   │   ├── components/
│   │   │   │   ├── ProjectCreateForm.tsx  # Project create form (main + sidebar)
│   │   │   │   └── ProjectsSidebar.tsx    # Sidebar with project list + create
│   │   │   └── pages/
│   │   │       ├── ProjectsPage.tsx       # Projects list & main create form
│   │   │       └── ProjectsPage.test.tsx  # ProjectsPage tests (basic)
│   │   ├── tasks/
│   │   │   └── pages/
│   │   │       └── ProjectTasksPage.tsx   # Placeholder for task list
│   │   ├── board/
│   │   │   └── pages/
│   │   │       └── BoardPage.tsx          # Placeholder for Kanban board
│   │   └── calendar/
│   │       └── pages/
│   │           └── CalendarPage.tsx       # Placeholder for calendar view
│   ├── shared/
│   │   ├── lib/
│   │   │   ├── api-client.ts          # Fetch wrapper with auth + JSON + auto-refresh
│   │   │   ├── auth-storage.ts        # In-memory access token
│   │   │   ├── cn.ts                  # Class name helper (clsx + tailwind-merge)
│   │   │   └── env.ts                 # VITE_API_BASE_URL resolver
│   │   ├── types/
│   │   │   └── api.ts                 # Shared API types (Me, Project, Task, etc.)
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── EmptyState.tsx
│   │       ├── ErrorBanner.tsx
│   │       ├── Input.tsx
│   │       ├── PageHeader.tsx
│   │       └── Spinner.tsx
│   ├── test/
│   │   └── utils/
│   │       └── renderWithProviders.tsx    # Wraps components in providers for tests
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
