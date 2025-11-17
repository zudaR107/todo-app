import { Router } from 'express';
import { validate } from '../../common/validate.js';
import { authGuard } from '../../common/auth.js';
import { registry } from '../../docs/registry.js';

import {
  taskIdParamSchema,
  projectTasksParamSchema,
  createTaskBody,
  updateTaskBody,
  listTasksQuery,
  taskResponse,
} from './tasks.schemas.js';

import { createTask, listTasks, getTask, patchTask } from './tasks.controller.js';

const r = Router();

/** OpenAPI: POST /projects/{projectId}/tasks */
registry.registerPath({
  method: 'post',
  path: '/projects/{projectId}/tasks',
  summary: 'Create a task in a project (owner or superadmin)',
  request: {
    params: projectTasksParamSchema,
    body: { content: { 'application/json': { schema: createTaskBody } } },
  },
  responses: {
    201: { description: 'Created', content: { 'application/json': { schema: taskResponse } } },
    400: { description: 'Validation error' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
    404: { description: 'Project not found' },
  },
  tags: ['Tasks'],
  security: [{ bearerAuth: [] }],
});
r.post(
  '/projects/:projectId/tasks',
  authGuard,
  validate({ params: projectTasksParamSchema, body: createTaskBody }),
  createTask,
);

/** OpenAPI: GET /projects/{projectId}/tasks */
registry.registerPath({
  method: 'get',
  path: '/projects/{projectId}/tasks',
  summary: 'List tasks in a project with filters & pagination',
  request: {
    params: projectTasksParamSchema,
    query: listTasksQuery,
  },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: taskResponse.array() } } },
    400: { description: 'Validation error' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
    404: { description: 'Project not found' },
  },
  tags: ['Tasks'],
  security: [{ bearerAuth: [] }],
});
r.get(
  '/projects/:projectId/tasks',
  authGuard,
  validate({ params: projectTasksParamSchema, query: listTasksQuery }),
  listTasks,
);

/** OpenAPI: GET /tasks/{id} */
registry.registerPath({
  method: 'get',
  path: '/tasks/{id}',
  summary: 'Get a task by id (owner of project or superadmin)',
  request: { params: taskIdParamSchema },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: taskResponse } } },
    400: { description: 'Validation error' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
    404: { description: 'Not found' },
  },
  tags: ['Tasks'],
  security: [{ bearerAuth: [] }],
});
r.get('/tasks/:id', authGuard, validate({ params: taskIdParamSchema }), getTask);

/** OpenAPI: PATCH /tasks/{id} */
registry.registerPath({
  method: 'patch',
  path: '/tasks/{id}',
  summary: 'Patch a task by id (owner of project or superadmin)',
  request: {
    params: taskIdParamSchema,
    body: { content: { 'application/json': { schema: updateTaskBody } } },
  },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: taskResponse } } },
    400: { description: 'Validation error' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
    404: { description: 'Not found' },
  },
  tags: ['Tasks'],
  security: [{ bearerAuth: [] }],
});
r.patch(
  '/tasks/:id',
  authGuard,
  validate({ params: taskIdParamSchema, body: updateTaskBody }),
  patchTask,
);

export default r;
