export const ROUTES = {
  login: '/login',
  projects: '/projects',
  projectTasks: (projectId = ':projectId') => `/projects/${projectId}/tasks`,
  projectBoard: (projectId = ':projectId') => `/projects/${projectId}/board`,
  calendar: '/calendar',
} as const;
