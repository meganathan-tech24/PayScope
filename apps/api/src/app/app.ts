import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';

import { errorHandler, notFoundHandler } from '../middleware/error.middleware.js';
import { createRateLimiter } from '../middleware/rate-limit.middleware.js';
import { requestIdMiddleware } from '../middleware/request-id.middleware.js';

import { config } from './config/config.js';
import { createRouter } from './routes.js';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.CORS_ORIGIN }));
  app.use(requestIdMiddleware);
  app.use(createRateLimiter());
  app.use(express.json({ limit: '1mb' }));

  app.use('/api/v1', createRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
