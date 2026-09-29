import { NotFoundError } from '../../lib/errors/app-error.js';

import * as repository from './employees.repository.js';
import type { EmployeeInput, ListEmployeesQuery } from './employees.schema.js';
import type { Employee, EmployeePage } from './employees.types.js';

export async function listEmployees(query: ListEmployeesQuery): Promise<EmployeePage> {
  const { page, pageSize, sortBy, sortDir, ...filters } = query;

  const { items, total } = await repository.listEmployees({
    filters,
    sort: { sortBy, sortDir },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  // A page past the end is a normal, empty result with accurate totals — not an error.
  return {
    items,
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

export async function getEmployee(id: string): Promise<Employee> {
  const employee = await repository.findEmployeeById(id);
  if (!employee) {
    throw new NotFoundError('Employee not found', 'EMPLOYEE_NOT_FOUND');
  }
  return employee;
}

export function createEmployee(data: EmployeeInput): Promise<Employee> {
  return repository.createEmployee(data);
}

export function updateEmployee(id: string, data: EmployeeInput): Promise<Employee> {
  return repository.updateEmployee(id, data);
}

export function deleteEmployee(id: string): Promise<void> {
  return repository.deleteEmployee(id);
}
