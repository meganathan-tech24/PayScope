import { clampPageSize, DEFAULT_PAGE_SIZE, isIsoCountryCode } from '@payscope/shared';
import { employeeBodySchema } from '@payscope/shared/employee';
import { z } from 'zod';

import { optionalFilter } from '../../lib/optional-filter.js';

// The create/update body is shared with the web form, so both enforce the same rules.
export { employeeBodySchema, MAX_SALARY_MINOR_UNITS } from '@payscope/shared/employee';

export const employeeIdParamsSchema = z.object({ id: z.string().uuid('Invalid id') }).strict();

export const EMPLOYEE_SORT_FIELDS = [
  'fullName',
  'email',
  'jobTitle',
  'department',
  'country',
  'salary',
  'hireDate',
  'createdAt',
] as const;

export const listEmployeesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(1_000_000).default(1),
    // Over the max is clamped to it rather than rejected.
    pageSize: z.coerce.number().int().min(1).default(DEFAULT_PAGE_SIZE).transform(clampPageSize),
    search: optionalFilter(z.string().trim().max(200)),
    country: optionalFilter(
      z
        .string()
        .trim()
        .toUpperCase()
        .refine(isIsoCountryCode, 'Must be an ISO 3166-1 alpha-2 country code'),
    ),
    department: optionalFilter(z.string().trim().max(200)),
    jobTitle: optionalFilter(z.string().trim().max(200)),
    sortBy: z.enum(EMPLOYEE_SORT_FIELDS).default('fullName'),
    sortDir: z.enum(['asc', 'desc']).default('asc'),
  })
  .strict();

// Same filters and sort as the list; page/pageSize don't apply to an export.
export const exportEmployeesQuerySchema = listEmployeesQuerySchema.omit({
  page: true,
  pageSize: true,
});

export type EmployeeInput = z.infer<typeof employeeBodySchema>;
export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;
export type ExportEmployeesQuery = z.infer<typeof exportEmployeesQuerySchema>;
export type EmployeeSortField = (typeof EMPLOYEE_SORT_FIELDS)[number];
