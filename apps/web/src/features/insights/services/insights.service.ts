import type {
  HeadcountRow,
  InsightStats,
  InsightView,
  OutlierList,
  SalaryBands,
  TenureSummary,
} from '@payscope/types';

import { apiClient } from '../../../services/api-client';
import { withQuery } from '../../../services/http';

export type HeadcountBy = 'country' | 'department' | 'jobTitle' | 'employmentType';
export type PayGroup = 'country' | 'jobTitle' | 'department';

interface Scope {
  view: InsightView;
  /** Only meaningful in the native view: amounts are then in this currency. */
  currency?: string;
}

// The native view is the API's default, so only the USD view is spelled out; a currency
// filter in the USD view would contradict it, so it is never sent there.
const scope = ({ view, currency }: Scope) => ({
  view: view === 'usd' ? 'usd' : undefined,
  currency: view === 'usd' ? undefined : currency,
});

export const insightsService = {
  headcount: (by: HeadcountBy) =>
    apiClient.get<HeadcountRow[]>(withQuery('/insights/headcount', { by })),

  stats: (groupBy: PayGroup, options: Scope) =>
    apiClient.get<InsightStats>(withQuery('/insights/stats', { groupBy, ...scope(options) })),

  salaryBands: (options: Scope, buckets = 10) =>
    apiClient.get<SalaryBands>(withQuery('/insights/salary-bands', { buckets, ...scope(options) })),

  tenure: (options: Scope) =>
    apiClient.get<TenureSummary>(withQuery('/insights/tenure', scope(options))),

  outliers: (currency: string | undefined, limit = 25) =>
    apiClient.get<OutlierList>(withQuery('/insights/outliers', { limit, currency })),
};
