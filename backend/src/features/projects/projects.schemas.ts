import { z } from 'zod';
import { registry } from '../../docs/registry.js';

export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const projectIdParamSchema = z
  .object({
    id: objectId,
  })
  .strict();

export const createProjectSchema = z
  .object({
    name: z.string().min(1).max(100),
    color: z
      .string()
      .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
      .optional(),
  })
  .strict();

export const updateProjectSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    color: z
      .string()
      .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
      .optional(),
  })
  .strict()
  .refine((x) => Object.keys(x).length > 0, {
    message: 'At least one field must be provided',
  });

export const projectResponseSchema = z
  .object({
    id: objectId,
    name: z.string(),
    color: z.string().optional(),
    ownerId: objectId,
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

createProjectSchema.openapi('CreateProjectBody');
updateProjectSchema.openapi('UpdateProjectBody');
projectResponseSchema.openapi('ProjectResponse');
projectIdParamSchema.openapi('ProjectIdParam');

registry.register('CreateProjectBody', createProjectSchema);
registry.register('UpdateProjectBody', updateProjectSchema);
registry.register('ProjectResponse', projectResponseSchema);
registry.register('ProjectIdParam', projectIdParamSchema);
