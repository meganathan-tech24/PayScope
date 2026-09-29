import type { ApiSuccessEnvelope } from '@payscope/types';
import type { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '../../lib/errors/app-error.js';

import { getCurrentUser, login, register } from './auth.service.js';
import type { AuthResult, AuthUser } from './auth.types.js';

export async function registerHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await register(req.body);
    const body: ApiSuccessEnvelope<AuthResult> = {
      success: true,
      data: result,
      meta: { requestId: req.requestId },
    };
    res.status(201).json(body);
  } catch (error) {
    next(error);
  }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await login(req.body);
    const body: ApiSuccessEnvelope<AuthResult> = {
      success: true,
      data: result,
      meta: { requestId: req.requestId },
    };
    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
}

export async function meHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const user = await getCurrentUser(req.user.id);
    const body: ApiSuccessEnvelope<AuthUser> = {
      success: true,
      data: user,
      meta: { requestId: req.requestId },
    };
    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
}

export function logoutHandler(req: Request, res: Response): void {
  const body: ApiSuccessEnvelope<{ message: string }> = {
    success: true,
    data: { message: 'Logged out' },
    meta: { requestId: req.requestId },
  };
  res.status(200).json(body);
}
