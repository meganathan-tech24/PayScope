import type { EmployeeDirectory, EmployeeFull, Role } from '@payscope/types';

import type { CsvCell } from '../../lib/csv.js';
import { NotFoundError } from '../../lib/errors/app-error.js';

import { exportColumnsFor } from './employees.export.js';
import * as repository from './employees.repository.js';
import type {
  EmployeeInput,
  ExportEmployeesQuery,
  ListEmployeesQuery,
} from './employees.schema.js';
import { serializeEmployee } from './employees.serializer.js';
import type { EmployeePage } from './employees.types.js';

// Every function that returns an employee takes the caller's role and returns
// the serialized shape, so a controller never sees (or forgets to filter) a raw row.
export async function listEmployees(query: ListEmployeesQuery, role: Role): Promise<EmployeePage> {
  const { page, pageSize, sortBy, sortDir, ...filters } = query;

  const { items, total } = await repository.listEmployees({
    filters,
    sort: { sortBy, sortDir },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  // A page past the end is a normal, empty result with accurate totals — not an error.
  return {
    items: items.map((employee) => serializeEmployee(employee, role)),
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

export async function getEmployee(
  id: string,
  role: Role,
): Promise<EmployeeFull | EmployeeDirectory> {
  const employee = await repository.findEmployeeById(id);
  if (!employee) {
    throw new NotFoundError('Employee not found', 'EMPLOYEE_NOT_FOUND');
  }
  return serializeEmployee(employee, role);
}

// Writes are HR-only (enforced by the router), so they answer with the full shape.
export async function createEmployee(data: EmployeeInput): Promise<EmployeeFull> {
  return serializeEmployee(await repository.createEmployee(data), 'HR_MANAGER');
}

export async function updateEmployee(id: string, data: EmployeeInput): Promise<EmployeeFull> {
  return serializeEmployee(await repository.updateEmployee(id, data), 'HR_MANAGER');
}

export function deleteEmployee(id: string): Promise<void> {
  return repository.deleteEmployee(id);
}

export interface EmployeeExport {
  header: string[];
  batches: AsyncGenerator<CsvCell[][]>;
}

// Rows come out already reduced to the columns this role may see.
export function exportEmployees(query: ExportEmployeesQuery, role: Role): EmployeeExport {
  const { sortBy, sortDir, ...filters } = query;
  const columns = exportColumnsFor(role);
  const source = repository.streamEmployees(filters, { sortBy, sortDir });

  async function* batches(): AsyncGenerator<CsvCell[][]> {
    for await (const batch of source) {
      yield batch.map((employee) => columns.map((column) => column.cell(employee)));
    }
  }

  return { header: columns.map((column) => column.header), batches: batches() };
}
