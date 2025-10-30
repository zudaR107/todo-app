import type { RequestHandler } from "express";
import type { ZodType } from 'zod';

export function validate(schemas: {
    body?: ZodType;
    query?: ZodType;
    params?: ZodType;
}): RequestHandler {
    return (req, _res, next) => {
        try {
            if (schemas.body) (req as any).body = schemas.body.parse(req.body);
            if (schemas.query) (req as any).query = schemas.query.parse(req.query);
            if (schemas.params) (req as any).params = schemas.params.parse(req.params);
            next();
        } catch (err) {
            next(err);
        }
    };
}
