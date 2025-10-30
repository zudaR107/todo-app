import createError from 'http-errors'
import { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'

export const notFound: RequestHandler = (_req, _res, next) => {
    next(createError(404, 'Not Found'));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof ZodError) {
        const details = err.flatten(issue => issue.message);
        return res.status(400).json({
            error: {
                message: 'Validation error',
                details
            }
        });
    }

    const status = (err.status as number) || 500;
    const message = err.expose ? err.message : 'Internal Server Error';

    return res.status(status).json({
        error: {
            message,
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
        }
    });
};