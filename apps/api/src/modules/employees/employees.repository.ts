import { Prisma, type Employee } from '@prisma/client';

import { prisma } from '../../database/prisma.js';
import { ConflictError, NotFoundError } from '../../lib/errors/app-error.js';

import type { EmployeeInput, EmployeeSortField } from './employees.schema.js';

export interface EmployeeFilters {
  search?: string;
  country?: string;
  department?: string;
  jobTitle?: string;
}

export interface EmployeeSort {
  sortBy: EmployeeSortField;
  sortDir: 'asc' | 'desc';
}

export function buildEmployeeWhere(filters: EmployeeFilters): Prisma.EmployeeWhereInput {
  const where: Prisma.EmployeeWhereInput = {};

  // Exact matches, so the btree indexes on these columns stay usable.
  if (filters.country) where.country = filters.country;
  if (filters.department) where.department = filters.department;
  if (filters.jobTitle) where.jobTitle = filters.jobTitle;

  if (filters.search) {
    where.OR = [
      { fullName: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return where;
}

export function buildEmployeeOrderBy(
  sort: EmployeeSort,
): Prisma.EmployeeOrderByWithRelationInput[] {
  // id as the final tiebreaker gives a total order, so pages never overlap or skip rows.
  return [{ [sort.sortBy]: sort.sortDir }, { id: 'asc' }];
}

export async function listEmployees(options: {
  filters: EmployeeFilters;
  sort: EmployeeSort;
  skip: number;
  take: number;
}): Promise<{ items: Employee[]; total: number }> {
  const where = buildEmployeeWhere(options.filters);
  const [total, items] = await prisma.$transaction([
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      orderBy: buildEmployeeOrderBy(options.sort),
      skip: options.skip,
      take: options.take,
    }),
  ]);
  return { items, total };
}

const EMAIL_TAKEN = () =>
  new ConflictError('An employee with this email already exists', 'EMPLOYEE_EMAIL_TAKEN');
const NOT_FOUND = () => new NotFoundError('Employee not found', 'EMPLOYEE_NOT_FOUND');

function isPrismaError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

export const EXPORT_BATCH_SIZE = 500;

// Yields matching employees a batch at a time using keyset (cursor) paging, so
// only one batch is in memory. Resuming from the last row's id is safe because
// buildEmployeeOrderBy always ends with id, giving a total order.
export async function* streamEmployees(
  filters: EmployeeFilters,
  sort: EmployeeSort,
  batchSize = EXPORT_BATCH_SIZE,
): AsyncGenerator<Employee[]> {
  const where = buildEmployeeWhere(filters);
  const orderBy = buildEmployeeOrderBy(sort);
  let cursorId: string | undefined;

  for (;;) {
    const batch = await prisma.employee.findMany({
      where,
      orderBy,
      take: batchSize,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
    });
    if (batch.length === 0) return;
    yield batch;
    if (batch.length < batchSize) return;
    cursorId = batch[batch.length - 1]?.id;
  }
}

export function findEmployeeById(id: string): Promise<Employee | null> {
  return prisma.employee.findUnique({ where: { id } });
}

export async function createEmployee(data: EmployeeInput): Promise<Employee> {
  try {
    return await prisma.employee.create({ data });
  } catch (error) {
    if (isPrismaError(error, 'P2002')) throw EMAIL_TAKEN();
    throw error;
  }
}

export async function updateEmployee(id: string, data: EmployeeInput): Promise<Employee> {
  try {
    return await prisma.employee.update({ where: { id }, data });
  } catch (error) {
    if (isPrismaError(error, 'P2002')) throw EMAIL_TAKEN();
    if (isPrismaError(error, 'P2025')) throw NOT_FOUND();
    throw error;
  }
}

export async function deleteEmployee(id: string): Promise<void> {
  try {
    await prisma.employee.delete({ where: { id } });
  } catch (error) {
    if (isPrismaError(error, 'P2025')) throw NOT_FOUND();
    throw error;
  }
}
