import { Router } from 'express';
import { validate } from '../../common/validate.js';
import { authGuard } from '../../common/auth.js';
import { registry } from '../../docs/registry.js';

import { calendarQuerySchema, calendarEventSchema } from './calendar.schemas.js';
import { getCalendar } from './calendar.controller.js';

const r = Router();

/** OpenAPI: GET /calendar */
registry.registerPath({
  method: 'get',
  path: '/calendar',
  summary: 'Get calendar events for tasks in a date range',
  request: {
    query: calendarQuerySchema,
  },
  responses: {
    200: {
      description: 'List of events',
      content: {
        'application/json': {
          schema: calendarEventSchema.array(),
        },
      },
    },
    400: { description: 'Validation error' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
    404: { description: 'Project not found (when projectId is provided)' },
  },
  tags: ['Calendar'],
  security: [{ bearerAuth: [] }],
});
r.get('/calendar', authGuard, validate({ query: calendarQuerySchema }), getCalendar);

export default r;
