import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

type Bag = {
  body?: unknown;
  query?: unknown;
  params?: unknown;
};

export function validate(schemas: {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}): RequestHandler {
  return (req, _res, next) => {
    try {
      const bag = req as unknown as Bag;

      if (schemas.body) {
        const parsed = schemas.body.parse(bag.body);
        bag.body = parsed;
      }
      if (schemas.query) {
        const parsed = schemas.query.parse(bag.query);
        bag.query = parsed;
      }
      if (schemas.params) {
        const parsed = schemas.params.parse(bag.params);
        bag.params = parsed;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
