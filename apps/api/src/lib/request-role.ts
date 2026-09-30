import type { Role } from '@payscope/types';
import type { Request } from 'express';

import { UnauthorizedError } from './errors/app-error.js';

// authenticate has already set req.user on every protected route; the check is
// here so a route wired up without it fails closed instead of guessing a role.
export function roleOf(req: Request): Role {
  if (!req.user) throw new UnauthorizedError();
  return req.user.role;
}
