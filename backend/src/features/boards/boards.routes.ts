import { Router } from 'express';
import { validate } from '../../common/validate.js';
import { authGuard } from '../../common/auth.js';
import { registry } from '../../docs/registry.js';

import { boardParamSchema, boardResponseSchema } from './boards.schemas.js';
import { getBoard } from './boards.controller.js';

const r = Router();

/** OpenAPI: GET /boards/{projectId} */
registry.registerPath({
  method: 'get',
  path: '/boards/{projectId}',
  summary: 'Get Kanban board for a project (group tasks by status)',
  request: {
    params: boardParamSchema,
  },
  responses: {
    200: {
      description: 'Board columns with tasks grouped by status',
      content: {
        'application/json': {
          schema: boardResponseSchema,
        },
      },
    },
    400: { description: 'Validation error' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
    404: { description: 'Project not found' },
  },
  tags: ['Boards'],
  security: [{ bearerAuth: [] }],
});
r.get('/boards/:projectId', authGuard, validate({ params: boardParamSchema }), getBoard);

export default r;
