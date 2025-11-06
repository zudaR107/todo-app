import { Router } from 'express';
import { validate } from '../../common/validate.js';
import { authGuard } from '../../common/auth.js';
import { registry } from '../../docs/registry.js';
import { LoginBody, MeResponse, AuthTokens, LoginResponse } from './auth.schemas.js';
import { login, refresh, logout, me } from './auth.controller.js';

const r = Router();

/** OpenAPI: /auth/login */
registry.registerPath({
  method: 'post',
  path: '/auth/login',
  summary: 'Login with email & password',
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
      headers: {
        'Set-Cookie': {
          description: 'Sets httpOnly refresh_token cookie',
          schema: {
            type: 'string',
            example: 'refresh_token=ey...; Path=/api/auth/refresh; HttpOnly; SameSite=Lax',
          },
        },
      },
      content: { 'application/json': { schema: LoginResponse } },
    },
    401: { description: 'Invalid credentials' },
  },
  tags: ['Auth'],
  security: [],
});
r.post('/login', validate({ body: LoginBody }), login);

/** OpenAPI: /auth/refresh */
registry.registerPath({
  method: 'post',
  path: '/auth/refresh',
  summary: 'Issue new access token using refresh cookie',
  responses: {
    200: {
      description: 'New access token',
      content: { 'application/json': { schema: AuthTokens } },
    },
    401: { description: 'Invalid or missing refresh' },
  },
  tags: ['Auth'],
  security: [],
});
r.post('/refresh', refresh);

/** OpenAPI: /auth/logout */
registry.registerPath({
  method: 'post',
  path: '/auth/logout',
  summary: 'Logout (clears refresh cookie)',
  responses: {
    204: {
      description: 'Logged out',
      headers: {
        'Set-Cookie': {
          description: 'Clears refresh_token cookie',
          schema: {
            type: 'string',
            example: 'refresh_token=; Path=/api/auth/refresh; HttpOnly; SameSite=Lax; Max-Age=0',
          },
        },
      },
    },
  },
  tags: ['Auth'],
  security: [],
});
r.post('/logout', logout);

/** OpenAPI: /auth/me */
registry.registerPath({
  method: 'get',
  path: '/auth/me',
  summary: 'Get current user profile',
  responses: {
    200: { description: 'Current user', content: { 'application/json': { schema: MeResponse } } },
    401: { description: 'Unauthorized' },
  },
  tags: ['Auth'],
  security: [{ bearerAuth: [] }],
});
r.get('/me', authGuard, me);

export default r;
