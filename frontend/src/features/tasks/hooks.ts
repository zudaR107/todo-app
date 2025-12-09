import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createTask,
  listTasks,
  updateTask,
  type CreateTaskBody,
  type ListTasksQuery,
  type TaskPriority,
  type TaskStatus,
  type UpdateTaskBody,
} from './api';

export interface TasksFilters {
  status: TaskStatus | null;
  priority: TaskPriority | null;
  tag: string;
  q: string;
  dueFrom: string;
  dueTo: string;
}

export const defaultTasksFilters: TasksFilters = {
  status: null,
  priority: null,
  tag: '',
  q: '',
  dueFrom: '',
  dueTo: '',
};

function mapFiltersToQuery(filters: TasksFilters): ListTasksQuery {
  const query: ListTasksQuery = {};

  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.priority) {
    query.priority = filters.priority;
  }
  if (filters.tag.trim()) {
    query.tag = filters.tag.trim();
  }
  if (filters.q.trim()) {
    query.q = filters.q.trim();
  }

  if (filters.dueFrom) {
    query.dueFrom = new Date(`${filters.dueFrom}T00:00:00.000Z`).toISOString();
  }

  if (filters.dueTo) {
    query.dueTo = new Date(`${filters.dueTo}T23:59:59.999Z`).toISOString();
  }

  return query;
}

function tasksQueryKey(projectId: string, filters: TasksFilters) {
  return ['tasks', projectId, { ...filters }];
}

export function useTasksQuery(projectId: string, filters: TasksFilters) {
  return useQuery({
    queryKey: tasksQueryKey(projectId, filters),
    queryFn: () => listTasks(projectId, mapFiltersToQuery(filters)),
    enabled: Boolean(projectId),
    staleTime: 30_000,
  });
}

export function useCreateTaskMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateTaskBody) => createTask(projectId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });
}

export interface UpdateTaskArgs {
  id: string;
  body: UpdateTaskBody;
  projectId: string;
}

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: UpdateTaskArgs) => updateTask(id, body),
    onSuccess: (_updatedTask, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.projectId] });
    },
  });
}
