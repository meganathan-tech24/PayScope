import type { Role } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '../lib/errors/app-error.js';
import { verifyToken } from '../lib/jwt.js';

const INVALID_TOKEN_MESSAGE = 'Invalid or expired token';
const BEARER_PREFIX = 'Bearer ';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith(BEARER_PREFIX)) {
    next(new UnauthorizedError(INVALID_TOKEN_MESSAGE));
    return;
  }

  const token = header.slice(BEARER_PREFIX.length).trim();

  if (!token) {
    next(new UnauthorizedError(INVALID_TOKEN_MESSAGE));
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role as Role };
    next();
  } catch {
    next(new UnauthorizedError(INVALID_TOKEN_MESSAGE));
  }
}
