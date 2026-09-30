import type {
  EmployeeDirectory,
  EmployeeFull,
  InsightStatsRow,
  InsightStatsRowBasic,
} from '@payscope/types';
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

// Insight statistics rows. The basic (VIEWER) row is strict, so a stray min or max fails to parse.
export const insightStatsRowBasicSchema = z
  .object({
    key: z.string(),
    currency: z.string(),
    headcount: z.number().int(),
    p25: z.number(),
    median: z.number(),
    avg: z.number(),
    p75: z.number(),
  })
  .strict() satisfies z.ZodType<InsightStatsRowBasic>;

export const insightStatsRowSchema = insightStatsRowBasicSchema.extend({
  min: z.number(),
  max: z.number(),
}) satisfies z.ZodType<InsightStatsRow>;
