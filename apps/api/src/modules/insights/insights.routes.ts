import { Router } from 'express';

import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';

import { statsHandler } from './insights.controller.js';
import { statsQuerySchema } from './insights.schema.js';

export const insightsRouter: Router = Router();

// Every insights route needs a valid token. Aggregates are open to any role (a
// VIEWER gets them with small groups suppressed); individuals are HR-only.
insightsRouter.use(authenticate);

insightsRouter.get('/stats', validate({ query: statsQuerySchema }), statsHandler);
