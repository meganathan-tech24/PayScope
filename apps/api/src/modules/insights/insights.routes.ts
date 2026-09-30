import { Router } from 'express';

import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/authorize.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';

import {
  headcountHandler,
  outliersHandler,
  salaryBandsHandler,
  statsHandler,
  tenureHandler,
} from './insights.controller.js';
import {
  headcountQuerySchema,
  outliersQuerySchema,
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
// Individuals with salaries: HR only. authorize runs before validate, so a VIEWER
// gets a 403 without learning anything about valid parameters.
insightsRouter.get(
  '/outliers',
  authorize('HR_MANAGER'),
  validate({ query: outliersQuerySchema }),
  outliersHandler,
);
