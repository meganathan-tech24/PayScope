import type { ApiSuccessEnvelope } from '@payscope/types';
import { Router } from 'express';

import { prisma } from '../database/prisma.js';
import { ServiceUnavailableError } from '../lib/errors/app-error.js';

export const router: Router = Router();

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
