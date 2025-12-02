import { useEffect, type PropsWithChildren, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../shared/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { ProjectsSidebar } from '../../features/projects/components/ProjectsSidebar';
import { useProjectsQuery } from '../../features/projects/hooks';
import { ROUTES } from '../routes';
import { cn } from '../../shared/lib/cn';

interface TabButtonProps {
  isActive: boolean;
  children: ReactNode;
  onClick: () => void;
}

function TabButton({ isActive, children, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1 text-[11px] font-medium transition-colors',
        isActive
          ? 'bg-emerald-500/20 text-emerald-300'
          : 'text-slate-300 hover:bg-slate-800 hover:text-slate-50',
      )}
    >
      {children}
    </button>
  );
}

export function MainLayout({ children }: PropsWithChildren) {
  const { user, logout, status } = useAuth();
  const {
    data: projects,
    isLoading: isProjectsLoading,
  } = useProjectsQuery();

  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ projectId?: string }>();

  const isAuthLoading = status === 'idle' || status === 'loading';
  const displayName = user?.displayName || user?.email || 'Гость';

  // projectId может приехать как параметр маршрута (/projects/:projectId/...)
  // или как query (?projectId=...), например для календаря
  const searchParams = new URLSearchParams(location.search);
  const queryProjectId = searchParams.get('projectId') ?? undefined;
  const projectId = params.projectId ?? queryProjectId;

  const currentProject =
    projectId && projects ? projects.find((project) => project.id === projectId) : undefined;

  const pathname = location.pathname;
  const isCalendarPage = pathname.startsWith(ROUTES.calendar);
  const hasProjectContext = Boolean(projectId);

  // Если в урле есть projectId, но такого проекта в данных уже нет (удалён / недоступен) —
  // после загрузки списка проектов отправляем пользователя обратно на список проектов.
  const projectNotFound =
    hasProjectContext && !isProjectsLoading && projects && !currentProject;

  useEffect(() => {
    if (projectNotFound) {
      navigate(ROUTES.projects, { replace: true });
    }
  }, [projectNotFound, navigate]);

  // Заголовок и сабтайтл topbar:
  // - по умолчанию — "todo-app"
  // - в контексте проекта — имя проекта
  // - глобальный календарь без projectId — отдельный заголовок
  let title = 'todo-app';
  let subtitle: string | null = 'Ежедневный планировщик на MERN + Typescript';

  if (hasProjectContext && currentProject) {
    title = currentProject.name;
    subtitle = 'Задачи, доска и календарь выбранного проекта.';
  } else if (isCalendarPage && !hasProjectContext) {
    title = 'Календарь';
    subtitle = 'Просмотр задач по датам начала и дедлайнам.';
  }

  const projectColor = currentProject?.color || '#10b981';

  const isTaskView = Boolean(projectId && pathname === ROUTES.projectTasks(projectId));
  const isBoardView = Boolean(projectId && pathname === ROUTES.projectBoard(projectId));
  const isCalendarView = isCalendarPage && Boolean(projectId);

  const handleLogout = () => {
    void logout();
  };

  const goToTasks = () => {
    if (projectId) {
      navigate(ROUTES.projectTasks(projectId));
    }
  };

  const goToBoard = () => {
    if (projectId) {
      navigate(ROUTES.projectBoard(projectId));
    }
  };

  const goToCalendar = () => {
    if (projectId) {
      navigate({
        pathname: ROUTES.calendar,
        search: `?projectId=${projectId}`,
      });
    } else {
      navigate(ROUTES.calendar);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden h-full w-64 shrink-0 border-r border-slate-800 bg-slate-950/80 p-4 md:flex md:flex-col">
        <ProjectsSidebar />
      </aside>

      {/* Main area */}
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex flex-shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: hasProjectContext ? projectColor : '#10b981' }}
              />
              <h1 className="text-sm font-semibold text-slate-50">{title}</h1>
            </div>
            {subtitle ? <p className="mt-1 text-xs text-slate-400">{subtitle}</p> : null}
          </div>

          <div className="flex items-center gap-3">
            {hasProjectContext && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="px-3 py-1 text-[11px]"
                onClick={() => navigate(ROUTES.projects)}
              >
                ← Все проекты
              </Button>
            )}

            {hasProjectContext && (
              <nav className="hidden items-center gap-1 rounded-full border border-slate-800 bg-slate-900/80 px-1 py-0.5 md:flex">
                <TabButton isActive={isTaskView} onClick={goToTasks}>
                  Задачи
                </TabButton>
                <TabButton isActive={isBoardView} onClick={goToBoard}>
                  Доска
                </TabButton>
                <TabButton isActive={isCalendarView} onClick={goToCalendar}>
                  Календарь
                </TabButton>
              </nav>
            )}

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>
                Пользователь:{' '}
                <span className="font-medium text-slate-300">
                  {isAuthLoading ? 'Проверяем сессию...' : displayName}
                </span>
              </span>
              {user ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="border border-slate-800/60 px-3 py-1 text-xs"
                  onClick={handleLogout}
                >
                  Выйти
                </Button>
              ) : null}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,#1f2937,#020617)] px-4 py-4">
          <div className="mx-auto h-full max-w-6xl animate-fade-in-up">{children}</div>
        </main>
      </div>
    </div>
  );
}
