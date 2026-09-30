import type { NextFunction, Request, Response } from 'express';

import type { Role } from '../generated/prisma/client.js';
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
