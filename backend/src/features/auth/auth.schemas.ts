import { z } from 'zod';
import { registry } from '../../docs/registry.js';

export const Role = z.enum(['superadmin', 'user']).openapi('Role');

export const LoginBody = z
  .object({
    email: z.email().openapi({ example: 'user@example.com' }),
    password: z.string().min(6).max(200).openapi({ example: 'secret123' }),
  })
  .openapi('LoginBody');

export const MeResponse = z
  .object({
    id: z
      .string()
      .regex(/^[0-9a-f]{24}$/i, 'Must be a Mongo ObjectId')
      .openapi({ example: '64f1c2a0e4b0c9a1d2345678' }),
    email: z.email().openapi({ example: 'user@example.com' }),
    displayName: z.string().openapi({ example: 'Alice' }),
    role: Role,
  })
  .openapi('MeResponse');

export const AuthTokens = z
  .object({
    accessToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
  })
  .openapi('AuthTokens');

export const LoginResponse = z
  .object({
    accessToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
    user: MeResponse,
  })
  .openapi('LoginResponse');

registry.register('Role', Role);
registry.register('LoginBody', LoginBody);
registry.register('MeResponse', MeResponse);
registry.register('AuthTokens', AuthTokens);
registry.register('LoginResponse', LoginResponse);
