import { z } from 'zod';
import { registry } from '../../docs/registry.js';
import { objectId, TaskStatus, taskResponse } from '../tasks/tasks.schemas.js';

export const boardParamSchema = z
  .object({
    projectId: objectId,
  })
  .strict()
  .openapi('BoardProjectParam');

export const boardColumnSchema = z
  .object({
    id: TaskStatus,
    name: z.string(),
    tasks: taskResponse.array(),
  })
  .strict()
  .openapi('BoardColumn');

export const boardResponseSchema = z
  .object({
    columns: boardColumnSchema.array(),
  })
  .strict()
  .openapi('BoardResponse');

registry.register('BoardProjectParam', boardParamSchema);
registry.register('BoardColumn', boardColumnSchema);
registry.register('BoardResponse', boardResponseSchema);

export type BoardParamInput = z.infer<typeof boardParamSchema>;
