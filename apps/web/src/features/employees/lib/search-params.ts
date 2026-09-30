import type { Role } from '@payscope/types';

import type { EmployeeListParams, SortDir } from '../types';

export const DEFAULT_PARAMS: EmployeeListParams = {
  page: 1,
  search: '',
  country: '',
  department: '',
  jobTitle: '',
  sortBy: 'fullName',
  sortDir: 'asc',
};

// Columns a person can sort by. Salary exists for HR only: for a VIEWER the option is
// not offered, the server rejects it, and a hand-typed URL falls back to the default.
const COMMON_SORT_FIELDS = ['fullName', 'jobTitle', 'department', 'country', 'hireDate'] as const;

export function sortFieldsFor(role: Role): readonly string[] {
  return role === 'HR_MANAGER' ? [...COMMON_SORT_FIELDS, 'salary'] : COMMON_SORT_FIELDS;
}

const text = (value: string | null): string => (value ?? '').trim().slice(0, 200);

/** Reads the URL into safe params: anything invalid falls back to its default. */
export function parseEmployeeParams(searchParams: URLSearchParams, role: Role): EmployeeListParams {
  const page = Number(searchParams.get('page'));
  const sortBy = searchParams.get('sortBy') ?? '';
  const sortDir = searchParams.get('sortDir');
  const country = text(searchParams.get('country')).toUpperCase();

  return {
    page: Number.isInteger(page) && page >= 1 && page <= 1_000_000 ? page : 1,
    search: text(searchParams.get('search')),
    country: /^[A-Z]{2}$/.test(country) ? country : '',
    department: text(searchParams.get('department')),
    jobTitle: text(searchParams.get('jobTitle')),
    sortBy: sortFieldsFor(role).includes(sortBy) ? sortBy : DEFAULT_PARAMS.sortBy,
    sortDir: (sortDir === 'desc' ? 'desc' : 'asc') satisfies SortDir,
  };
}

/** Writes params into a URL query, leaving out defaults so URLs stay short. */
export function toSearchParams(params: EmployeeListParams): URLSearchParams {
  const query = new URLSearchParams();
  (Object.keys(DEFAULT_PARAMS) as (keyof EmployeeListParams)[]).forEach((key) => {
    if (params[key] !== DEFAULT_PARAMS[key]) query.set(key, String(params[key]));
  });
  return query;
}
