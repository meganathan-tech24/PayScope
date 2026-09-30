import type { Role } from '@payscope/types';

import { ValidationError } from '../../lib/errors/app-error.js';

import type { EmployeeSortField } from './employees.schema.js';

// A sorted (or filtered) list reveals salary ranking even when the salary
// itself is not in the response, so a role that cannot see salary cannot
// order by it. Any future salary filter must be added to this check too.
export function assertQueryAllowed(query: { sortBy: EmployeeSortField }, role: Role): void {
  if (role !== 'HR_MANAGER' && query.sortBy === 'salary') {
    throw new ValidationError('sortBy: salary sorting is not available for your role');
  }
}
