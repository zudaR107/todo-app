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
    id: z.string(),
    email: z.email(),
    displayName: z.string(),
    role: Role,
  })
  .openapi('MeResponse');

export const AuthTokens = z
  .object({
    accessToken: z.string(),
  })
  .openapi('AuthTokens');

registry.register('Role', Role);
registry.register('LoginBody', LoginBody);
registry.register('MeResponse', MeResponse);
registry.register('AuthTokens', AuthTokens);
