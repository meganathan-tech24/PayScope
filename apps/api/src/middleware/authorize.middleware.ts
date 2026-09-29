import type { Role } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';

import { ForbiddenError } from '../lib/errors/app-error.js';

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new ForbiddenError());
      return;
    }
    next();
  };
}
