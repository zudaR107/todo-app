// src/app/router.tsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthLayout } from './layout/AuthLayout';
import { MainLayout } from './layout/MainLayout';
import { ROUTES } from './routes';
import { AuthGuard } from './AuthGuard';
import { RequireProjects } from './RequireProjects';

import { LoginPage } from '../features/auth/pages/LoginPage';
import { ProjectsPage } from '../features/projects/pages/ProjectsPage';
import { ProjectTasksPage } from '../features/tasks/pages/ProjectTasksPage';
import { BoardPage } from '../features/board/pages/BoardPage';
import { CalendarPage } from '../features/calendar/pages/CalendarPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- Публичный логин --- */}
        <Route
          path={ROUTES.login}
          element={
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          }
        />

        {/* --- Страница проектов (можно даже без RequireProjects, здесь проекты как раз создаются) --- */}
        <Route
          path={ROUTES.projects}
          element={
            <AuthGuard>
              <MainLayout>
                <ProjectsPage />
              </MainLayout>
            </AuthGuard>
          }
        />

        {/* --- Страница задач конкретного проекта --- */}
        <Route
          path={ROUTES.projectTasks()}
          element={
            <AuthGuard>
              <MainLayout>
                <RequireProjects>
                  <ProjectTasksPage />
                </RequireProjects>
              </MainLayout>
            </AuthGuard>
          }
        />

        {/* --- Доска проекта --- */}
        <Route
          path={ROUTES.projectBoard()}
          element={
            <AuthGuard>
              <MainLayout>
                <RequireProjects>
                  <BoardPage />
                </RequireProjects>
              </MainLayout>
            </AuthGuard>
          }
        />

        {/* --- Календарь --- */}
        <Route
          path={ROUTES.calendar}
          element={
            <AuthGuard>
              <MainLayout>
                <RequireProjects>
                  <CalendarPage />
                </RequireProjects>
              </MainLayout>
            </AuthGuard>
          }
        />

        {/* --- Редиректы по умолчанию --- */}
        <Route path="/" element={<Navigate to={ROUTES.projects} replace />} />
        <Route path="*" element={<Navigate to={ROUTES.projects} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
