import { z } from 'zod';

import { isIsoCountryCode, isIsoCurrencyCode } from './iso-codes.js';

// Postgres INTEGER tops out at 2,147,483,647; stay safely under it.
export const MAX_SALARY_MINOR_UNITS = 2_000_000_000;

export const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'] as const;

const requiredText = (field: string) =>
  z.string().trim().min(1, `${field} is required`).max(200, `${field} is too long`);

// Shared by the API (request validation) and the web form, so both enforce the same rules.
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
    employmentType: z.enum(EMPLOYMENT_TYPES),
    hireDate: z.coerce
      .date({ error: 'Invalid hireDate' })
      .refine((date) => date.getTime() <= Date.now(), 'hireDate cannot be in the future'),
  })
  .strict();

export type EmployeeInput = z.infer<typeof employeeBodySchema>;
