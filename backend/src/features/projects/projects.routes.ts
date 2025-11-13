import { Router } from 'express';
import { validate } from '../../common/validate.js';
import { authGuard } from '../../common/auth.js';
import { registry } from '../../docs/registry.js';

import {
  createProjectSchema,
  updateProjectSchema,
  projectIdParamSchema,
  projectResponseSchema,
} from './projects.schemas.js';

import {
  createProject,
  listMyProjects,
  patchProject,
  deleteProject,
} from './projects.controller.js';

const r = Router();

/** OpenAPI: POST /projects */
registry.registerPath({
  method: 'post',
  path: '/projects',
  summary: 'Create a project (owner = current user)',
  request: {
    body: { content: { 'application/json': { schema: createProjectSchema } } },
  },
  responses: {
    201: {
      description: 'Project created',
      content: { 'application/json': { schema: projectResponseSchema } },
    },
    400: { description: 'Validation error' },
    401: { description: 'Unauthorized' },
  },
  tags: ['Projects'],
  security: [{ bearerAuth: [] }],
});
r.post('/', authGuard, validate({ body: createProjectSchema }), createProject);

/** OpenAPI: GET /projects */
registry.registerPath({
  method: 'get',
  path: '/projects',
  summary: 'List my projects',
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: projectResponseSchema.array() } },
    },
    401: { description: 'Unauthorized' },
  },
  tags: ['Projects'],
  security: [{ bearerAuth: [] }],
});
r.get('/', authGuard, listMyProjects);

/** OpenAPI: PATCH /projects/{id} */
registry.registerPath({
  method: 'patch',
  path: '/projects/{id}',
  summary: 'Update a project (owner or superadmin)',
  request: {
    params: projectIdParamSchema,
    body: { content: { 'application/json': { schema: updateProjectSchema } } },
  },
  responses: {
    200: {
      description: 'Project updated',
      content: { 'application/json': { schema: projectResponseSchema } },
    },
    400: { description: 'Validation error' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
    404: { description: 'Not Found' },
  },
  tags: ['Projects'],
  security: [{ bearerAuth: [] }],
});
r.patch(
  '/:id',
  authGuard,
  validate({ params: projectIdParamSchema, body: updateProjectSchema }),
  patchProject,
);

/** OpenAPI: DELETE /projects/{id} */
registry.registerPath({
  method: 'delete',
  path: '/projects/{id}',
  summary: 'Delete a project (owner or superadmin)',
  request: { params: projectIdParamSchema },
  responses: {
    204: { description: 'No Content' },
    400: { description: 'Validation error' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
    404: { description: 'Not Found' },
  },
  tags: ['Projects'],
  security: [{ bearerAuth: [] }],
});
r.delete('/:id', authGuard, validate({ params: projectIdParamSchema }), deleteProject);

export default r;
