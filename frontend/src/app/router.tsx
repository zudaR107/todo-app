import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthLayout } from './layout/AuthLayout';
import { MainLayout } from './layout/MainLayout';
import { ROUTES } from './routes';
import { AuthGuard } from './AuthGuard';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { ProjectsPage } from '../features/projects/pages/ProjectsPage';
import { ProjectTasksPage } from '../features/tasks/pages/ProjectTasksPage';
import { BoardPage } from '../features/board/pages/BoardPage';
import { CalendarPage } from '../features/calendar/pages/CalendarPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path={ROUTES.login}
          element={
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          }
        />

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

        <Route
          path={ROUTES.projectTasks()}
          element={
            <AuthGuard>
              <MainLayout>
                <ProjectTasksPage />
              </MainLayout>
            </AuthGuard>
          }
        />

        <Route
          path={ROUTES.projectBoard()}
          element={
            <AuthGuard>
              <MainLayout>
                <BoardPage />
              </MainLayout>
            </AuthGuard>
          }
        />

        <Route
          path={ROUTES.calendar}
          element={
            <AuthGuard>
              <MainLayout>
                <CalendarPage />
              </MainLayout>
            </AuthGuard>
          }
        />

        <Route path="/" element={<Navigate to={ROUTES.projects} replace />} />

        <Route path="*" element={<Navigate to={ROUTES.projects} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
