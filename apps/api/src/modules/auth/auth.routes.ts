import { Router } from 'express';

import { authenticate } from '../../middleware/auth.middleware.js';
import { createRateLimiter } from '../../middleware/rate-limit.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';

import { loginHandler, logoutHandler, meHandler, registerHandler } from './auth.controller.js';
import { loginBodySchema, registerBodySchema } from './auth.schema.js';

// Built per app (like the app-wide limiter) so each createApp() gets its own
// in-memory counter and tests never share rate-limit state.
export function createAuthRouter(): Router {
  const authRouter = Router();

  // Stricter than the app-wide default (Phase 2): register/login are the
  // obvious brute-force/enumeration targets.
  const authRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 10 });

  authRouter.post(
    '/register',
    authRateLimiter,
    validate({ body: registerBodySchema }),
    registerHandler,
  );
  authRouter.post('/login', authRateLimiter, validate({ body: loginBodySchema }), loginHandler);
  authRouter.get('/me', authenticate, meHandler);
  authRouter.post('/logout', authenticate, logoutHandler);

  return authRouter;
}
