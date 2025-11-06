import { z } from 'zod';
import { registry } from '../../docs/registry.js';
import { Role } from '../auth/auth.schemas.js';

export const CreateUserBody = z
  .object({
    email: z.email().openapi({ example: 'user@example.com' }),
    displayName: z.string().min(1).max(100).openapi({ example: 'User Name' }),
    password: z.string().min(6).max(200).openapi({ example: 'secret123' }),
    role: Role.default('user').optional().openapi({ example: 'user' }),
  })
  .strict()
  .openapi('CreateUserBody');

export const UserResponse = z
  .object({
    id: z
      .string()
      .regex(/^[0-9a-f]{24}$/i, 'Must be a Mongo ObjectId')
      .openapi({ example: '64f1c2a0e4b0c9a1d2345678' }),
    email: z.email().openapi({ example: 'user@example.com' }),
    displayName: z.string().openapi({ example: 'User Name' }),
    role: Role,
  })
  .openapi('UserResponse');

registry.register('CreateUserBody', CreateUserBody);
registry.register('UserResponse', UserResponse);
