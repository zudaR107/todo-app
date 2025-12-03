import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../shared/ui/Button';
import { ErrorBanner } from '../../../shared/ui/ErrorBanner';
import { cn } from '../../../shared/lib/cn';
import { useProjectsQuery } from '../hooks';
import { ProjectCreateForm } from './ProjectCreateForm';
import { ROUTES } from '../../../app/routes';

export function ProjectsSidebar() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: projects, isLoading, isError, refetch } = useProjectsQuery();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ projectId?: string }>();
  const activeProjectId = params.projectId ?? null;

  const handleProjectClick = (projectId: string) => {
    const pathname = location.pathname;

    if (pathname.includes('/board')) {
      navigate(ROUTES.projectBoard(projectId));
      return;
    }

    navigate(ROUTES.projectTasks(projectId));
  };

  const handleCreated = (project: { id: string }) => {
    setShowCreate(false);
    navigate(ROUTES.projectTasks(project.id));
  };

  const hasProjects = (projects?.length ?? 0) > 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-400/80">todo-app</p>
        <h2 className="mt-2 text-sm font-semibold text-slate-50">Мои проекты</h2>
        <p className="mt-1 text-xs text-slate-500">
          {hasProjects
            ? 'Выберите проект, чтобы перейти к задачам.'
            : 'Список проектов появится здесь.'}
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-dashed border-slate-800/80 bg-slate-950/40 p-3 text-xs">
        {isLoading && !projects ? (
          <div className="space-y-2">
            <div className="h-6 rounded-md bg-slate-800/60 animate-pulse" />
            <div className="h-6 rounded-md bg-slate-800/60 animate-pulse" />
            <div className="h-6 rounded-md bg-slate-800/60 animate-pulse" />
          </div>
        ) : isError ? (
          <ErrorBanner
            message="Не удалось загрузить проекты."
            onRetry={refetch}
            className="text-[11px]"
          />
        ) : hasProjects ? (
          <ul className="space-y-1">
            {projects!.map((project) => {
              const isActive = project.id === activeProjectId;
              const color = project.color || '#10b981';

              return (
                <li key={project.id}>
                  <button
                    type="button"
                    onClick={() => handleProjectClick(project.id)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition-colors',
                      isActive
                        ? 'bg-slate-800 text-slate-50'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-slate-50',
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate">{project.name}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-xs text-slate-500">
            <p>Проектов пока нет.</p>
            <p>Создайте первый проект, чтобы начать планировать задачи.</p>
          </div>
        )}

        {showCreate ? (
          <div className="mt-3 border-t border-slate-800/80 pt-3">
            <ProjectCreateForm
              variant="sidebar"
              onCreated={handleCreated}
              onCancel={() => setShowCreate(false)}
            />
          </div>
        ) : null}
      </div>

      <Button
        className="mt-4 w-full"
        size="sm"
        variant="secondary"
        onClick={() => setShowCreate((prev) => !prev)}
      >
        {showCreate ? 'Скрыть форму' : '+ Новый проект'}
      </Button>
    </div>
  );
}
