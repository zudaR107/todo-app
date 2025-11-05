import createError from 'http-errors';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

export const notFound: RequestHandler = (_req, _res, next) => {
  next(createError(404, 'Not Found'));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  void _next;

  if (err instanceof ZodError) {
    const details = err.flatten((issue) => issue.message);
    return res.status(400).json({
      error: { message: 'Validation error', details },
    });
  }

  let status = 500;
  let message = 'Internal Server Error';
  let stack: string | undefined;

  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>;
    if (typeof e.status === 'number') status = e.status;
    const expose = typeof e.expose === 'boolean' ? e.expose : false;
    if (expose && typeof e.message === 'string') message = e.message;
    if (process.env.NODE_ENV !== 'production' && typeof e.stack === 'string') stack = e.stack;
  }

  return res.status(status).json({ error: { message, ...(stack ? { stack } : {}) } });
};
