import { Router } from 'express';

import { authenticate } from '../../middleware/auth.middleware.js';
import { createRateLimiter } from '../../middleware/rate-limit.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';

import { loginHandler, logoutHandler, meHandler, registerHandler } from './auth.controller.js';
import { loginBodySchema, registerBodySchema } from './auth.schema.js';

export const authRouter: Router = Router();

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
