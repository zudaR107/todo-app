import { Router } from 'express';
import { validate } from '../../common/validate.js';
import { authGuard, requireRole } from '../../common/auth.js';
import { registry } from '../../docs/registry.js';
import { CreateUserBody, UserResponse } from './users.schemas.js';
import { createUser } from './users.controller.js';

const r = Router();

/** OpenAPI: POST /users (admin-only) */
registry.registerPath({
  method: 'post',
  path: '/users',
  summary: 'Create user (superadmin only)',
  request: {
    body: { content: { 'application/json': { schema: CreateUserBody } } },
  },
  responses: {
    201: { description: 'User created', content: { 'application/json': { schema: UserResponse } } },
    400: { description: 'Validation error' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden (requires superadmin role)' },
    409: { description: 'Email exists' },
  },
  tags: ['Users'],
  security: [{ bearerAuth: [] }],
});
r.post('/', authGuard, requireRole('superadmin'), validate({ body: CreateUserBody }), createUser);

export default r;
