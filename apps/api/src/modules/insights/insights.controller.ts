import type { ApiSuccessEnvelope } from '@payscope/types';
import type { NextFunction, Request, Response } from 'express';

import { roleOf } from '../../lib/request-role.js';

import type { HeadcountQuery, SalaryBandsQuery, StatsQuery } from './insights.schema.js';
import * as service from './insights.service.js';

// validate() has already replaced req.query with the parsed values.
function envelope<T>(req: Request, data: T): ApiSuccessEnvelope<T> {
  return { success: true, data, meta: { requestId: req.requestId } };
}

export async function statsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await service.getStats(req.query as unknown as StatsQuery, roleOf(req));
    res.status(200).json(envelope(req, stats));
  } catch (error) {
    next(error);
  }
}

export async function headcountHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const rows = await service.getHeadcount(req.query as unknown as HeadcountQuery);
    res.status(200).json(envelope(req, rows));
  } catch (error) {
    next(error);
  }
}

export async function salaryBandsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const bands = await service.getSalaryBands(
      req.query as unknown as SalaryBandsQuery,
      roleOf(req),
    );
    res.status(200).json(envelope(req, bands));
  } catch (error) {
    next(error);
  }
}
