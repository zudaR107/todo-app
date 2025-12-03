import { apiClient } from '../../shared/lib/api-client';

export interface Project {
  id: string;
  name: string;
  color?: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectBody {
  name: string;
  color?: string;
}

export interface UpdateProjectBody {
  name?: string;
  color?: string;
}

export async function listProjects(): Promise<Project[]> {
  return apiClient<Project[]>('/projects', {
    method: 'GET',
  });
}

export async function createProject(body: CreateProjectBody): Promise<Project> {
  return apiClient<Project>('/projects', {
    method: 'POST',
    body,
  });
}

export async function updateProject(id: string, body: UpdateProjectBody): Promise<Project> {
  return apiClient<Project>(`/projects/${id}`, {
    method: 'PATCH',
    body,
  });
}

export async function deleteProject(id: string): Promise<void> {
  await apiClient<void>(`/projects/${id}`, {
    method: 'DELETE',
  });
}
