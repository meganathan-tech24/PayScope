import type { EmployeeDirectory, EmployeeFull } from '@payscope/types';

// HR_MANAGER receives the full shape, VIEWER the directory shape (no salary key at all).
export type EmployeeRow = EmployeeFull | EmployeeDirectory;

export const PAGE_SIZE = 25;

export type SortDir = 'asc' | 'desc';

export interface EmployeeListParams {
  page: number;
  search: string;
  country: string;
  department: string;
  jobTitle: string;
  sortBy: string;
  sortDir: SortDir;
}

export function hasSalary(employee: EmployeeRow): employee is EmployeeFull {
  return 'salary' in employee;
}
