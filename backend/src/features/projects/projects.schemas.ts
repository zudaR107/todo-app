import { z } from 'zod';

export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const projectIdParamSchema = z.object({
  id: objectId,
});

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .optional(),
});

export const updateProjectSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    color: z
      .string()
      .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
      .optional(),
  })
  .refine((x) => Object.keys(x).length > 0, {
    message: 'At least one field must be provided',
  });

export const projectResponseSchema = z.object({
  id: objectId,
  name: z.string(),
  color: z.string().optional(),
  ownerId: objectId,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
