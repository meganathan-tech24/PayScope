import { isIsoCountryCode, isIsoCurrencyCode } from '@payscope/shared';
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

export type EmployeeInput = z.infer<typeof employeeBodySchema>;
