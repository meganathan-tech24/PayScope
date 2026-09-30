import { isIsoCountryCode, isIsoCurrencyCode } from '@payscope/shared';
import { z } from 'zod';

import { optionalFilter } from '../../lib/optional-filter.js';

const country = optionalFilter(
  z
    .string()
    .trim()
    .toUpperCase()
    .refine(isIsoCountryCode, 'Must be an ISO 3166-1 alpha-2 country code'),
);
const currency = optionalFilter(
  z.string().trim().toUpperCase().refine(isIsoCurrencyCode, 'Must be an ISO 4217 currency code'),
);
const text = optionalFilter(z.string().trim().max(200));

const filters = { country, currency, department: text, jobTitle: text };
const view = z.enum(['native', 'usd']).default('native');

export const STATS_GROUP_BY = ['country', 'jobTitle', 'department', 'org'] as const;
export const HEADCOUNT_BY = ['country', 'department', 'jobTitle', 'employmentType'] as const;

export const statsQuerySchema = z
  .object({ ...filters, groupBy: z.enum(STATS_GROUP_BY).default('country'), view })
  .strict()
  .refine((query) => query.groupBy !== 'org' || query.view === 'usd', {
    path: ['groupBy'],
    message: 'org-wide statistics mix currencies, so they need view=usd',
  });

export const headcountQuerySchema = z
  .object({ ...filters, by: z.enum(HEADCOUNT_BY).default('country') })
  .strict();

export const salaryBandsQuerySchema = z
  .object({
    ...filters,
    view,
    buckets: z.coerce.number().int().min(2).max(30).default(10),
  })
  .strict()
  .refine((query) => query.view === 'usd' || query.currency !== undefined, {
    path: ['currency'],
    message: 'currency is required unless view=usd (bands must not mix currencies)',
  })
  .refine((query) => query.view === 'native' || query.currency === undefined, {
    path: ['currency'],
    message: 'currency cannot be combined with view=usd',
  });

export const tenureQuerySchema = z.object({ ...filters, view }).strict();

export const outliersQuerySchema = z
  .object({ ...filters, limit: z.coerce.number().int().min(1).max(100).default(50) })
  .strict();

export type StatsQuery = z.infer<typeof statsQuerySchema>;
export type HeadcountQuery = z.infer<typeof headcountQuerySchema>;
export type SalaryBandsQuery = z.infer<typeof salaryBandsQuerySchema>;
export type TenureQuery = z.infer<typeof tenureQuerySchema>;
export type OutliersQuery = z.infer<typeof outliersQuerySchema>;
export type InsightFilters = Pick<StatsQuery, 'country' | 'currency' | 'department' | 'jobTitle'>;
