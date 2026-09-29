import type { NextFunction, Request, Response } from 'express';
import { nanoid } from 'nanoid';

const SAFE_REQUEST_ID = /^[A-Za-z0-9_-]{1,64}$/;

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers['x-request-id'];
  const trusted = typeof incoming === 'string' && SAFE_REQUEST_ID.test(incoming);

  req.requestId = trusted ? incoming : `req_${nanoid()}`;
  res.setHeader('X-Request-Id', req.requestId);

  next();
}
