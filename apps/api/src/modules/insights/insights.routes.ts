import { Router } from 'express';

import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';

import {
  headcountHandler,
  salaryBandsHandler,
  statsHandler,
  tenureHandler,
} from './insights.controller.js';
import {
  headcountQuerySchema,
  salaryBandsQuerySchema,
  statsQuerySchema,
  tenureQuerySchema,
} from './insights.schema.js';

export const insightsRouter: Router = Router();

// Every insights route needs a valid token. Aggregates are open to any role (a
// VIEWER gets them with small groups suppressed); individuals are HR-only.
insightsRouter.use(authenticate);

insightsRouter.get('/stats', validate({ query: statsQuerySchema }), statsHandler);
insightsRouter.get('/headcount', validate({ query: headcountQuerySchema }), headcountHandler);
insightsRouter.get(
  '/salary-bands',
  validate({ query: salaryBandsQuerySchema }),
  salaryBandsHandler,
);
insightsRouter.get('/tenure', validate({ query: tenureQuerySchema }), tenureHandler);
