import { once } from 'node:events';

import type { ApiSuccessEnvelope, EmployeeDirectory, EmployeeFull, Role } from '@payscope/types';
import type { NextFunction, Request, Response } from 'express';

import { toCsvRow } from '../../lib/csv.js';
import { UnauthorizedError } from '../../lib/errors/app-error.js';

import type {
  EmployeeInput,
  ExportEmployeesQuery,
  ListEmployeesQuery,
} from './employees.schema.js';
import * as service from './employees.service.js';

// validate() has already replaced req.query/params/body with the parsed values.
const idOf = (req: Request): string => req.params.id as string;
// authenticate has already set req.user on every employees route; the check is
// here so a route wired up without it fails closed instead of guessing a role.
function roleOf(req: Request): Role {
  if (!req.user) throw new UnauthorizedError();
  return req.user.role;
}

function envelope<T>(req: Request, data: T): ApiSuccessEnvelope<T> {
  return { success: true, data, meta: { requestId: req.requestId } };
}

export async function listEmployeesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { items, meta } = await service.listEmployees(
      req.query as unknown as ListEmployeesQuery,
      roleOf(req),
    );
    const body: ApiSuccessEnvelope<(EmployeeFull | EmployeeDirectory)[]> = {
      success: true,
      data: items,
      meta: { requestId: req.requestId, ...meta },
    };
    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
}

export async function getEmployeeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.status(200).json(envelope(req, await service.getEmployee(idOf(req), roleOf(req))));
  } catch (error) {
    next(error);
  }
}

export async function createEmployeeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const employee = await service.createEmployee(req.body as EmployeeInput);
    res.status(201).json(envelope(req, employee));
  } catch (error) {
    next(error);
  }
}

export async function updateEmployeeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const employee = await service.updateEmployee(idOf(req), req.body as EmployeeInput);
    res.status(200).json(envelope(req, employee));
  } catch (error) {
    next(error);
  }
}

export async function deleteEmployeeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await service.deleteEmployee(idOf(req));
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function exportEmployeesCsvHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { header, batches } = service.exportEmployees(
      req.query as unknown as ExportEmployeesQuery,
      roleOf(req),
    );
    // Fetch the first batch before sending headers: a database failure here is
    // still a normal JSON error response rather than a half-written file.
    let batch = await batches.next();

    const filename = `employees-${new Date().toISOString().slice(0, 10)}.csv`;
    res.status(200);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const closed = new Promise<void>((resolve) => res.once('close', resolve));
    const write = async (chunk: string): Promise<void> => {
      // Respect backpressure so a slow client doesn't make us buffer the file.
      if (!res.write(chunk)) {
        await Promise.race([once(res, 'drain'), closed]);
      }
    };

    await write(toCsvRow(header));
    while (!batch.done && !res.destroyed) {
      for (const cells of batch.value) {
        await write(toCsvRow(cells));
      }
      batch = await batches.next();
    }
    res.end();
  } catch (error) {
    next(error);
  }
}
