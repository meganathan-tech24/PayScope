import type { ApiErrorEnvelope } from '@payscope/types';
import rateLimit, { type Options } from 'express-rate-limit';

export function createRateLimiter(options: Partial<Options> = {}) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const body: ApiErrorEnvelope = {
        success: false,
        message: 'Too many requests, please try again later',
        code: 'RATE_LIMITED',
        requestId: req.requestId ?? 'unknown',
      };
      res.status(429).json(body);
    },
    ...options,
  });
}
