import { Router } from 'express';
import { validate } from '../../common/validate.js';
import { authGuard } from '../../common/auth.js';
import { registry } from '../../docs/registry.js';
import { LoginBody, MeResponse, AuthTokens } from './auth.schemas.js';
import { login, refresh, logout, me } from './auth.controller.js';

const r = Router();

/** OpenAPI: /auth/login */
registry.registerPath({
  method: 'post',
  path: '/auth/login',
  request: {
    body: {
      content: {
        'application/json': { schema: LoginBody },
      },
    },
  },
  responses: {
    200: {
      description: 'Logged in',
      content: { 'application/json': { schema: AuthTokens } },
    },
    401: { description: 'Invalid credentials' },
  },
  tags: ['Auth'],
});
r.post('/login', validate({ body: LoginBody }), login);

/** OpenAPI: /auth/refresh */
registry.registerPath({
  method: 'post',
  path: '/auth/refresh',
  responses: {
    200: {
      description: 'New access token',
      content: { 'application/json': { schema: AuthTokens } },
    },
    401: { description: 'Invalid or missing refresh' },
  },
  tags: ['Auth'],
});
r.post('/refresh', refresh);

/** OpenAPI: /auth/logout */
registry.registerPath({
  method: 'post',
  path: '/auth/logout',
  responses: { 204: { description: 'Logged out' } },
  tags: ['Auth'],
});
r.post('/logout', logout);

/** OpenAPI: /auth/me */
registry.registerPath({
  method: 'get',
  path: '/auth/me',
  responses: {
    200: { description: 'Current user', content: { 'application/json': { schema: MeResponse } } },
    401: { description: 'Unauthorized' },
  },
  tags: ['Auth'],
  security: [{ bearerAuth: [] }],
});
r.get('/me', authGuard, me);

export default r;
