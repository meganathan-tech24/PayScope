import {
  clampPageSize,
  DEFAULT_PAGE_SIZE,
  isIsoCountryCode,
  isIsoCurrencyCode,
} from '@payscope/shared';
import { z } from 'zod';

// Postgres INTEGER tops out at 2,147,483,647; stay safely under it.
export const MAX_SALARY_MINOR_UNITS = 2_000_000_000;

const requiredText = (field: string) =>
  z.string().trim().min(1, `${field} is required`).max(200, `${field} is too long`);

export const employeeBodySchema = z
  .object({
    fullName: requiredText('fullName'),
    email: z.string().trim().toLowerCase().email('Invalid email address'),
    jobTitle: requiredText('jobTitle'),
    department: requiredText('department'),
    country: z
      .string()
      .trim()
      .toUpperCase()
      .refine(isIsoCountryCode, 'Must be an ISO 3166-1 alpha-2 country code'),
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .refine(isIsoCurrencyCode, 'Must be an ISO 4217 currency code'),
    salary: z
      .number()
      .int('Salary must be an integer in minor units')
      .min(0, 'Salary cannot be negative')
      .max(MAX_SALARY_MINOR_UNITS, 'Salary is unrealistically large'),
    employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']),
    hireDate: z.coerce
      .date({ invalid_type_error: 'Invalid hireDate' })
      .refine((date) => date.getTime() <= Date.now(), 'hireDate cannot be in the future'),
  })
  .strict();

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

// A blank filter (e.g. a cleared search box) means "no filter", not a 400.
const optionalFilter = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    schema.optional(),
  );

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

export type EmployeeInput = z.infer<typeof employeeBodySchema>;
export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;
export type EmployeeSortField = (typeof EMPLOYEE_SORT_FIELDS)[number];
