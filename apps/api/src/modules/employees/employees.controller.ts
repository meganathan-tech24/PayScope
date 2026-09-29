import type { ApiSuccessEnvelope } from '@payscope/types';
import type { NextFunction, Request, Response } from 'express';

import type { EmployeeInput, ListEmployeesQuery } from './employees.schema.js';
import * as service from './employees.service.js';
import type { Employee } from './employees.types.js';

// validate() has already replaced req.query/params/body with the parsed values.
const idOf = (req: Request): string => req.params.id as string;

function envelope<T>(req: Request, data: T): ApiSuccessEnvelope<T> {
  return { success: true, data, meta: { requestId: req.requestId } };
}

export async function listEmployeesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { items, meta } = await service.listEmployees(req.query as unknown as ListEmployeesQuery);
    const body: ApiSuccessEnvelope<Employee[]> = {
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
    res.status(200).json(envelope(req, await service.getEmployee(idOf(req))));
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
