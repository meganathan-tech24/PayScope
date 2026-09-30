import type { ApiErrorEnvelope } from '@payscope/types';
import type { NextFunction, Request, Response } from 'express';

import { NotFoundError } from '../lib/errors/app-error.js';
import { classifyError } from '../lib/errors/classify-error.js';
import { logger } from '../lib/logging/logger.js';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const classified = classifyError(err);
  const requestId = req.requestId ?? 'unknown';
  const rawMessage = err instanceof Error ? err.message : String(err);

  logger.error(rawMessage, {
    requestId,
    method: req.method,
    path: req.path,
    statusCode: classified.statusCode,
    errorCode: classified.code,
    stack: err instanceof Error ? err.stack : undefined,
  });

  // Once streaming has started we can't send a JSON envelope; cut the connection
  // so the client sees a truncated download instead of a silently short file.
  if (res.headersSent) {
    res.destroy();
    return;
  }

  const body: ApiErrorEnvelope = {
    success: false,
    message: classified.message,
    code: classified.code,
    requestId,
  };

  res.status(classified.statusCode).json(body);
}
