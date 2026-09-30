import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodSchema } from 'zod';

import { ValidationError } from '../lib/errors/app-error.js';

export interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        // Express 5 makes req.query a read-only getter, so plain assignment is
        // ignored; shadow it with an own property holding the parsed values.
        Object.defineProperty(req, 'query', {
          value: schemas.query.parse(req.query),
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; ');
        next(new ValidationError(message));
        return;
      }
      next(error);
    }
  };
}
