import * as React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { Button } from '../../../shared/ui/Button';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { ErrorBanner } from '../../../shared/ui/ErrorBanner';
import { Spinner } from '../../../shared/ui/Spinner';
import { TaskFilters } from '../components/TaskFilters';
import { TaskList } from '../components/TaskList';
import { TaskForm, type TaskFormValues } from '../components/TaskForm';
import {
  defaultTasksFilters,
  useCreateTaskMutation,
  useTasksQuery,
  useUpdateTaskMutation,
  type TasksFilters as TaskFiltersType,
  type UpdateTaskArgs,
} from '../hooks';
import type { Task, TaskPriority, TaskStatus, CreateTaskBody, UpdateTaskBody } from '../api';

const TASK_STATUSES: TaskStatus[] = ['todo', 'doing', 'done'];
const TASK_PRIORITIES: TaskPriority[] = ['low', 'normal', 'high'];

function parseStatusParam(raw: string | null): TaskStatus | null {
  if (!raw) return null;
  return TASK_STATUSES.includes(raw as TaskStatus) ? (raw as TaskStatus) : null;
}

function parsePriorityParam(raw: string | null): TaskPriority | null {
  if (!raw) return null;
  return TASK_PRIORITIES.includes(raw as TaskPriority) ? (raw as TaskPriority) : null;
}

function filtersFromSearchParams(searchParams: URLSearchParams): TaskFiltersType {
  return {
    status: parseStatusParam(searchParams.get('status')),
    priority: parsePriorityParam(searchParams.get('priority')),
    tag: searchParams.get('tag') ?? '',
    q: searchParams.get('q') ?? '',
    dueFrom: searchParams.get('dueFrom') ?? '',
    dueTo: searchParams.get('dueTo') ?? '',
  };
}

function filtersToSearchParams(filters: TaskFiltersType): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set('status', filters.status);
  }
  if (filters.priority) {
    params.set('priority', filters.priority);
  }
  if (filters.tag.trim()) {
    params.set('tag', filters.tag.trim());
  }
  if (filters.q.trim()) {
    params.set('q', filters.q.trim());
  }
  if (filters.dueFrom) {
    params.set('dueFrom', filters.dueFrom);
  }
  if (filters.dueTo) {
    params.set('dueTo', filters.dueTo);
  }

  return params;
}

function mapFormValuesToCreateBody(values: TaskFormValues): CreateTaskBody {
  const tags =
    values.tagInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean) ?? [];

  return {
    title: values.title,
    description: values.description || undefined,
    status: values.status,
    priority: values.priority,
    tags: tags.length ? tags : undefined,
    dueAt: values.dueDate ? new Date(`${values.dueDate}T00:00:00.000Z`).toISOString() : undefined,
    allDay: values.dueDate ? true : undefined,
  };
}

function mapFormValuesToUpdateBody(values: TaskFormValues): UpdateTaskBody {
  const tags =
    values.tagInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean) ?? [];

  const body: UpdateTaskBody = {
    title: values.title,
    description: values.description || undefined,
    status: values.status,
    priority: values.priority,
    tags: tags.length ? tags : undefined,
  };

  if (values.dueDate) {
    body.dueAt = new Date(`${values.dueDate}T00:00:00.000Z`).toISOString();
    body.allDay = true;
  } else {
    body.dueAt = null;
    body.allDay = null;
  }

  return body;
}

export function ProjectTasksPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [searchParams, setSearchParams] = useSearchParams();

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);

  const filters = React.useMemo<TaskFiltersType>(
    () => filtersFromSearchParams(searchParams),
    [searchParams],
  );

  const tasksQuery = useTasksQuery(projectId ?? '', filters);
  const createMutation = useCreateTaskMutation(projectId ?? '');
  const updateMutation = useUpdateTaskMutation();

  if (!projectId) {
    return (
      <div className="space-y-4">
        <PageHeader title="Задачи" />
        <ErrorBanner message="Не указан идентификатор проекта в URL." />
      </div>
    );
  }

  const handleFiltersChange = (next: TaskFiltersType) => {
    const params = filtersToSearchParams(next);
    setSearchParams(params, { replace: true });
  };

  const handleOpenCreate = () => {
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setFormError(null);
    setEditingTask(task);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
  };

  const handleCloseEdit = () => {
    setEditingTask(null);
  };

  const handleCreateSubmit = async (values: TaskFormValues) => {
    setFormError(null);
    const body = mapFormValuesToCreateBody(values);

    try {
      await createMutation.mutateAsync(body);
      setIsCreateOpen(false);
    } catch {
      setFormError('Не удалось сохранить задачу. Попробуйте ещё раз.');
    }
  };

  const handleEditSubmit = async (values: TaskFormValues) => {
    if (!editingTask) return;
    setFormError(null);
    const body = mapFormValuesToUpdateBody(values);

    const args: UpdateTaskArgs = {
      id: editingTask.id,
      body,
      projectId,
    };

    try {
      await updateMutation.mutateAsync(args);
      setEditingTask(null);
    } catch {
      setFormError('Не удалось обновить задачу. Попробуйте ещё раз.');
    }
  };

  const isBusy = tasksQuery.isFetching || createMutation.isPending || updateMutation.isPending;

  const hasTasks = (tasksQuery.data?.length ?? 0) > 0;

  return (
    <>
      <div className="space-y-4">
        <PageHeader
          title="Задачи"
          description="Список задач выбранного проекта с фильтрами по статусу, приоритету и дедлайну."
          actions={
            <Button type="button" size="sm" onClick={handleOpenCreate}>
              + Задача
            </Button>
          }
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
          <TaskFilters value={filters ?? defaultTasksFilters} onChange={handleFiltersChange} />

          <div className="space-y-3">
            {tasksQuery.isLoading && !tasksQuery.data ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-16 rounded-2xl border border-slate-800/80 bg-slate-900/60 animate-pulse"
                  />
                ))}
              </div>
            ) : tasksQuery.isError ? (
              <ErrorBanner
                message="Не удалось загрузить задачи."
                onRetry={() => tasksQuery.refetch()}
              />
            ) : !hasTasks ? (
              <EmptyState
                title="В этом проекте пока нет задач."
                description="Создайте первую задачу, чтобы начать планирование. Её всегда можно отредактировать или поменять статус."
              />
            ) : (
              <>
                <TaskList tasks={tasksQuery.data ?? []} onTaskClick={handleOpenEdit} />
                <p className="text-xs text-slate-500">
                  Задач в списке: {tasksQuery.data?.length ?? 0}
                </p>
              </>
            )}
          </div>
        </div>

        {isBusy && (
          <div className="flex items-center gap-2 pt-2 text-xs text-slate-500">
            <Spinner className="h-4 w-4" />
            <span>Обновляем список задач...</span>
          </div>
        )}
      </div>

      {/* Создание задачи */}
      <TaskForm
        mode="create"
        open={isCreateOpen}
        onClose={handleCloseCreate}
        onSubmit={handleCreateSubmit}
        isSubmitting={createMutation.isPending}
        externalError={formError}
      />

      {/* Редактирование задачи */}
      <TaskForm
        mode="edit"
        initialTask={editingTask}
        open={Boolean(editingTask)}
        onClose={handleCloseEdit}
        onSubmit={handleEditSubmit}
        isSubmitting={updateMutation.isPending}
        externalError={formError}
      />
    </>
  );
}
