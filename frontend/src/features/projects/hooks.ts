import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createProject,
  deleteProject,
  updateProject,
  listProjects,
  type CreateProjectBody,
  type UpdateProjectBody,
  type Project,
} from './api';

export const PROJECTS_QUERY_KEY = ['projects'] as const;

export function useProjectsQuery() {
  return useQuery<Project[]>({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: listProjects,
    staleTime: 30_000,
  });
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateProjectBody) => createProject(body),
    onSuccess: (createdProject) => {
      queryClient.setQueryData<Project[]>(PROJECTS_QUERY_KEY, (prev) =>
        prev ? [...prev, createdProject] : [createdProject],
      );
    },
  });
}

interface UpdateProjectArgs {
  id: string;
  body: UpdateProjectBody;
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: UpdateProjectArgs) => updateProject(id, body),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData<Project[]>(PROJECTS_QUERY_KEY, (prev) =>
        prev
          ? prev.map((project) => (project.id === updatedProject.id ? updatedProject : project))
          : [updatedProject],
      );
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Project[]>(PROJECTS_QUERY_KEY, (prev) =>
        prev ? prev.filter((project) => project.id !== id) : [],
      );
    },
  });
}

export type { Project, CreateProjectBody, UpdateProjectBody } from './api';
