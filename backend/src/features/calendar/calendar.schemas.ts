import { z } from 'zod';
import { registry } from '../../docs/registry.js';
import { objectId, TaskStatus, TaskPriority } from '../tasks/tasks.schemas.js';

export const calendarQuerySchema = z
  .object({
    from: z.iso.datetime(),
    to: z.iso.datetime(),
    projectId: objectId.optional(),
  })
  .strict()
  .refine((v) => v.from <= v.to, {
    message: '"to" must be greater than or equal to "from"',
    path: ['to'],
  })
  .openapi('CalendarQuery');

export const calendarEventSchema = z
  .object({
    id: objectId,
    title: z.string(),
    start: z.iso.datetime(),
    end: z.iso.datetime().optional(),
    allDay: z.boolean().optional(),
    projectId: objectId,
    status: TaskStatus,
    priority: TaskPriority,
  })
  .strict()
  .openapi('CalendarEvent');

registry.register('CalendarQuery', calendarQuerySchema);
registry.register('CalendarEvent', calendarEventSchema);

export type CalendarQueryInput = z.infer<typeof calendarQuerySchema>;
