import type { CsvCell } from '../../lib/csv.js';

import type { Employee } from './employees.types.js';

// Salary is exported exactly as stored (integer minor units); the currency
// column next to it is what makes the number unambiguous.
export const EXPORT_COLUMNS = [
  'id',
  'fullName',
  'email',
  'jobTitle',
  'department',
  'country',
  'currency',
  'salary',
  'employmentType',
  'hireDate',
] as const;

export function employeeToCsvCells(employee: Employee): CsvCell[] {
  return [
    employee.id,
    employee.fullName,
    employee.email,
    employee.jobTitle,
    employee.department,
    employee.country,
    employee.currency,
    employee.salary,
    employee.employmentType,
    employee.hireDate.toISOString().slice(0, 10),
  ];
}
