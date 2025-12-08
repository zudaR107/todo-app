import { apiClient } from '../../shared/lib/api-client';

export type TaskStatus = 'todo' | 'doing' | 'done';
export type TaskPriority = 'low' | 'normal' | 'high';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  startAt?: string | null;
  dueAt?: string | null;
  allDay?: boolean | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListTasksQuery {
  status?: TaskStatus;
  priority?: TaskPriority;
  tag?: string;
  q?: string;
  dueFrom?: string;
  dueTo?: string;
  limit?: number;
  offset?: number | null;
}

export interface CreateTaskBody {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  tags?: string[];
  startAt?: string;
  dueAt?: string;
  allDay?: boolean;
}

export interface UpdateTaskBody {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  tags?: string[];
  startAt?: string;
  dueAt?: string;
  allDay?: boolean;
}

function toQueryString(params: Record<string, string | number | null | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    searchParams.append(key, String(value));
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export async function listTasks(projectId: string, query: ListTasksQuery = {}): Promise<Task[]> {
  const qs = toQueryString({
    status: query.status,
    priority: query.priority,
    tag: query.tag,
    q: query.q,
    dueFrom: query.dueFrom,
    dueTo: query.dueTo,
    limit: query.limit,
    offset: query.offset ?? undefined,
  });

  return apiClient<Task[]>(`/projects/${projectId}/tasks${qs}`, {
    method: 'GET',
  });
}

export async function createTask(projectId: string, body: CreateTaskBody): Promise<Task> {
  return apiClient<Task>(`/projects/${projectId}/tasks`, {
    method: 'POST',
    body,
  });
}

export async function updateTask(id: string, body: UpdateTaskBody): Promise<Task> {
  return apiClient<Task>(`/tasks/${id}`, {
    method: 'PATCH',
    body,
  });
}
