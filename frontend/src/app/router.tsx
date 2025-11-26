import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthLayout } from './layout/AuthLayout';
import { MainLayout } from './layout/MainLayout';
import { ROUTES } from './routes';
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
            <MainLayout>
              <ProjectsPage />
            </MainLayout>
          }
        />

        <Route
          path={ROUTES.projectTasks()}
          element={
            <MainLayout>
              <ProjectTasksPage />
            </MainLayout>
          }
        />

        <Route
          path={ROUTES.projectBoard()}
          element={
            <MainLayout>
              <BoardPage />
            </MainLayout>
          }
        />

        <Route
          path={ROUTES.calendar}
          element={
            <MainLayout>
              <CalendarPage />
            </MainLayout>
          }
        />

        <Route path="*" element={<Navigate to={ROUTES.projects} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
