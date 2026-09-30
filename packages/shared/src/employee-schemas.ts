import type { EmployeeDirectory, EmployeeFull } from '@payscope/types';
import { z } from 'zod';

// Response schemas. Strict, so an unexpected key (say, a leaked salary) fails to parse.
export const employeeDirectorySchema = z
  .object({
    id: z.string(),
    fullName: z.string(),
    email: z.string(),
    jobTitle: z.string(),
    department: z.string(),
    country: z.string(),
    currency: z.string(),
    employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']),
    hireDate: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict() satisfies z.ZodType<EmployeeDirectory>;

export const employeeFullSchema = employeeDirectorySchema.extend({
  salary: z.number().int(),
}) satisfies z.ZodType<EmployeeFull>;
