import { z } from 'zod';
import { registry } from '../../docs/registry.js';

export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid objectId');

export const TaskStatus = z.enum(['todo', 'doing', 'done']).openapi('TaskStatus');
export const TaskPriority = z.enum(['low', 'normal', 'high']).openapi('TaskPriority');

export const taskIdParamSchema = z
  .object({
    id: objectId,
  })
  .strict()
  .openapi('TaskIdParam');

export const projectTasksParamSchema = z
  .object({
    projectId: objectId,
  })
  .strict()
  .openapi('ProjectTasksParam');

export const createTaskBody = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(10_000).optional(),
    status: TaskStatus.optional(),
    priority: TaskPriority.optional(),
    tags: z.array(z.string().min(1).max(50)).max(50).optional(),
    startAt: z.iso.datetime().optional(),
    dueAt: z.iso.datetime().optional(),
    allDay: z.boolean().optional(),
  })
  .strict()
  .openapi('CreateTaskBody');

export const updateTaskBody = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(10_000).optional(),
    status: TaskStatus.optional(),
    priority: TaskPriority.optional(),
    tags: z.array(z.string().min(1).max(50)).max(50).optional(),
    startAt: z.iso.datetime().optional(),
    dueAt: z.iso.datetime().optional(),
    allDay: z.boolean().optional(),
  })
  .strict()
  .refine((x) => Object.keys(x).length > 0, { message: 'At least one field must be provided' })
  .openapi('UpdateTaskBody');

export const listTasksQuery = z
  .object({
    status: TaskStatus.optional(),
    priority: TaskPriority.optional(),
    tag: z.string().min(1).max(50).optional(),
    q: z.string().min(1).max(200).optional(),
    dueFrom: z.iso.datetime().optional(),
    dueTo: z.iso.datetime().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .strict()
  .openapi('ListTasksQuery');

export const taskResponse = z
  .object({
    id: objectId,
    projectId: objectId,
    title: z.string(),
    description: z.string().optional(),
    status: TaskStatus,
    priority: TaskPriority,
    tags: z.array(z.string()),
    startAt: z.iso.datetime().optional(),
    dueAt: z.iso.datetime().optional(),
    allDay: z.boolean().optional(),
    createdBy: objectId,
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict()
  .openapi('TaskResponse');

registry.register('TaskStatus', TaskStatus);
registry.register('TaskPriority', TaskPriority);
registry.register('TaskIdParam', taskIdParamSchema);
registry.register('ProjectTasksParam', projectTasksParamSchema);
registry.register('CreateTaskBody', createTaskBody);
registry.register('UpdateTaskBody', updateTaskBody);
registry.register('ListTasksQuery', listTasksQuery);
registry.register('TaskResponse', taskResponse);

export type CreateTaskInput = z.infer<typeof createTaskBody>;
export type UpdateTaskInput = z.infer<typeof updateTaskBody>;
export type ListTasksQueryInput = z.infer<typeof listTasksQuery>;
