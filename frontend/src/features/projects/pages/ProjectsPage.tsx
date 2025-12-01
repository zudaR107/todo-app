import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { Spinner } from '../../../shared/ui/Spinner';
import { ErrorBanner } from '../../../shared/ui/ErrorBanner';
import { ProjectCreateForm } from '../components/ProjectCreateForm';
import { useDeleteProjectMutation, useProjectsQuery, useUpdateProjectMutation } from '../hooks';
import type { Project, UpdateProjectBody } from '../api';
import { ROUTES } from '../../../app/routes';
import { Input } from '../../../shared/ui/Input';
import { cn } from '../../../shared/lib/cn';

interface ProjectCardProps {
  project: Project;
  onOpen: (id: string) => void;
  onUpdate: (id: string, body: UpdateProjectBody) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isBusy?: boolean;
}

function ProjectCard({ project, onOpen, onUpdate, onDelete, isBusy }: ProjectCardProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [name, setName] = React.useState(project.name);
  const [color, setColor] = React.useState(project.color || '#10b981');
  const [error, setError] = React.useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    try {
      await onUpdate(project.id, { name, color });
      setIsEditing(false);
    } catch {
      setError('Не удалось сохранить изменения.');
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(`Удалить проект «${project.name}»? Это действие необратимо.`);
    if (!confirmed) {
      return;
    }

    try {
      await onDelete(project.id);
    } catch {
      setError('Не удалось удалить проект.');
    }
  };

  const created = new Date(project.createdAt);
  const createdLabel = created.toLocaleDateString();

  return (
    <Card className='flex flex-col gap-3'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <div className='flex items-center gap-2'>
            <span
              className='inline-flex h-2.5 w-2.5 shrink-0 rounded-full'
              style={{ backgroundColor: color || '#10b981' }}
            />
            {isEditing ? (
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className='h-8 max-w-56 ext-sm'
              />
            ) : (
              <h2 className='truncate text-sm font-semibold text-slate-50'>{project.name}</h2>
            )}
          </div>
          <p className='mt-2 text-xs text-slate-500'>Создан {createdLabel}</p>
        </div>

        <Button
          type='button'
          size='sm'
          variant='secondary'
          onClick={() => onOpen(project.id)}
          disabled={isBusy}
        >
          Открыть
        </Button>
      </div>

      {isEditing ? (
        <div className='space-y-2'>
          <div className='space-y-1'>
            <span className='block text-xs font-medium text-slate-200'>Цвет проекта</span>
            <div className='flex items-center gap-3'>
              <input
                type='color'
                aria-label='Цвет проекта'
                value={color}
                onChange={(event) => setColor(event.target.value)}
                className='h-7 w-7 cursor-pointer rounded-md border border-slate-700 bg-slate-900/80'
              />
              <span className='text-xs text-slate-400'>
                Цвет используется как индикатор проекта в разных представлениях.
              </span>
            </div>
          </div>

          {error ? (
            <p className='text-xs text-red-400'>{error}</p>
          ) : (
            <p className='text-xs text-slate-500'>
              Можно изменить название и цвет. Эти изменения не затрагивают задачи.
            </p>
          )}

          <div className='flex items-center gap-2'>
            <Button
              type='button'
              size='sm'
              onClick={handleSave}
              disabled={isBusy || name.trim().length === 0}
            >
              Сохранить
            </Button>
            <Button
              type='button'
              size='sm'
              variant='ghost'
              onClick={() => {
                setIsEditing(false);
                setName(project.name);
                setColor(project.color || '#10b981');
                setError(null);
              }}
              disabled={isBusy}
            >
              Отмена
            </Button>
          </div>
        </div>
      ) : (
        <div className='flex items-center justify-between gap-2'>
          <p className='text-xs text-slate-500'>
            {project.color
              ? 'Проект с настроенным цветом.'
              : 'Цвет не задан - используется цвет по умолчанию.'}
          </p>
          <div className='flex items-center gap-1'>
            <Button
              type='button'
              size='sm'
              variant='ghost'
              className='px-2 text-[11px]'
              onClick={() => setIsEditing(true)}
              disabled={isBusy}
            >
              Редактировать
            </Button>
            <Button
              type='button'
              size='sm'
              variant='ghost'
              className='px-2 text-[11px] text-red-300 hover:text-red-200'
              onClick={handleDelete}
              disabled={isBusy}
            >
              Удалить
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export function ProjectsPage() {
  const navigate = useNavigate();
  const projectsQuery = useProjectsQuery();
  const updateMutation = useUpdateProjectMutation();
  const deleteMutation = useDeleteProjectMutation();

  const { data: projects, isLoading, isError, refetch } = projectsQuery;

  const createFormRef = useRef<HTMLDivElement | null>(null);

  const handleOpen = (id: string) => {
    navigate(ROUTES.projectTasks(id));
  };

  const handleUpdate = async (id: string, body: UpdateProjectBody) => {
    await updateMutation.mutateAsync({ id, body });
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const isBusy = updateMutation.isPending || deleteMutation.isPending;
  const hasProjects = (projects?.length ?? 0) > 0;

  return (
    <div className='space-y-4'>
      <PageHeader
        title='Проекты'
        description='Разделяйте рабочие, личные и учебные задачи по отдельным проектам.'
      />

      <div ref={createFormRef} className='mb-2 max-w-md'>
        <Card className='space-y-3'>
          <h2 className='text-sm font-semibold text-slate-50'>Новый проект</h2>
          <p className='text-xs text-slate-500'>
            Создайте новый проект, чтобы группировать задачи по контексту.
          </p>
          <ProjectCreateForm />
        </Card>
      </div>

      {isLoading && !projects ? (
        <div className='mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className='animate-pulse'>
              <div className='h-4 w-32 rounded bg-slate-800/80' />
              <div className='mt-3 h-3 w-24 rounded bg-slate-800/80' />
            </Card>
          ))}
        </div>
      ) : isError ? (
        <div className='mt-4'>
          <ErrorBanner message='Не удалось загрузить проекты.' onRetry={refetch} />
        </div>
      ) : !hasProjects ? (
        <div className='mt-6'>
          <EmptyState
            title='Проектов пока нет.'
            description='Создайте первый проект, чтобы начать планировать задачи и видеть их в списке и на доске.'
            actionLabel='Создать проект'
            onActionClick={() => {
              createFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start'});
              const input = createFormRef.current?.querySelector(
                'input[name="name"]',
              ) as HTMLInputElement | null;
              input?.focus();
            }}
          />
        </div>
      ) : (
        <div className={cn('mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3')}>
          
        </div>
      )}
    </div>
  );
}
