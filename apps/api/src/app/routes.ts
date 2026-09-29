import type { ApiSuccessEnvelope } from '@payscope/types';
import { Router } from 'express';

import { prisma } from '../database/prisma.js';
import { ServiceUnavailableError } from '../lib/errors/app-error.js';
import { authRouter } from '../modules/auth/auth.routes.js';

export const router: Router = Router();

router.use('/auth', authRouter);

router.get('/health', async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    const body: ApiSuccessEnvelope<{ status: string; database: string }> = {
      success: true,
      data: { status: 'ok', database: 'up' },
      meta: { requestId: req.requestId },
    };
    res.json(body);
  } catch {
    next(new ServiceUnavailableError());
  }
});
