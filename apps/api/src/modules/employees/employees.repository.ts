import { Prisma, type Employee } from '@prisma/client';

import { prisma } from '../../database/prisma.js';
import { ConflictError, NotFoundError } from '../../lib/errors/app-error.js';

import type { EmployeeInput } from './employees.schema.js';

const EMAIL_TAKEN = () =>
  new ConflictError('An employee with this email already exists', 'EMPLOYEE_EMAIL_TAKEN');
const NOT_FOUND = () => new NotFoundError('Employee not found', 'EMPLOYEE_NOT_FOUND');

function isPrismaError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
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
