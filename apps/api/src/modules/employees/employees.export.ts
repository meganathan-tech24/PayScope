import type { Role } from '@payscope/types';

import type { CsvCell } from '../../lib/csv.js';

import type { Employee } from './employees.types.js';

interface ExportColumn {
  header: string;
  // Opt-in: a column is visible to every role unless it says otherwise.
  hrOnly?: true;
  cell: (employee: Employee) => CsvCell;
}

// Salary is exported exactly as stored (integer minor units); the currency
// column next to it is what makes the number unambiguous.
const COLUMNS: readonly ExportColumn[] = [
  { header: 'id', cell: (e) => e.id },
  { header: 'fullName', cell: (e) => e.fullName },
  { header: 'email', cell: (e) => e.email },
  { header: 'jobTitle', cell: (e) => e.jobTitle },
  { header: 'department', cell: (e) => e.department },
  { header: 'country', cell: (e) => e.country },
  { header: 'currency', cell: (e) => e.currency },
  { header: 'salary', hrOnly: true, cell: (e) => e.salary },
  { header: 'employmentType', cell: (e) => e.employmentType },
  { header: 'hireDate', cell: (e) => e.hireDate.toISOString().slice(0, 10) },
];

// The header and every row are built from this one list, so a column can
// never be dropped from one and not the other.
export function exportColumnsFor(role: Role): readonly ExportColumn[] {
  return COLUMNS.filter((column) => !column.hrOnly || role === 'HR_MANAGER');
}
