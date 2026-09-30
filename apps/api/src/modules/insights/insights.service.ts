import type {
  HeadcountRow,
  InsightMeta,
  InsightStats,
  InsightView,
  OutlierList,
  Role,
  SalaryBands,
  TenureSummary,
} from '@payscope/types';

import { ForbiddenError } from '../../lib/errors/app-error.js';

import { canSeeGroup, limitGroupsForRole } from './insights.access.js';
import { buildBuckets } from './insights.bands.js';
import * as repository from './insights.repository.js';
import type {
  HeadcountQuery,
  InsightFilters,
  OutliersQuery,
  SalaryBandsQuery,
  StatsQuery,
  TenureQuery,
} from './insights.schema.js';

// The USD view is labelled approximate (static rates) and says how many employees
// could not be converted; the native view never converts anything.
async function metaFor(view: InsightView, filters: InsightFilters): Promise<InsightMeta> {
  if (view === 'native') return { view, approximate: false, excludedHeadcount: 0 };
  return { view, approximate: true, excludedHeadcount: await repository.countWithoutRate(filters) };
}

export async function getStats(query: StatsQuery, role: Role): Promise<InsightStats> {
  const { groupBy, view, ...filters } = query;

  const groups = await repository.getStats(groupBy, filters, repository.salarySource(view));
  const { visible, suppressed } = limitGroupsForRole(groups, role);

  return { ...(await metaFor(view, filters)), rows: visible, suppressedGroups: suppressed };
}

// Headcount carries no salary data, so every role sees every group.
export async function getHeadcount(query: HeadcountQuery): Promise<HeadcountRow[]> {
  const { by, ...filters } = query;
  return repository.getHeadcount(by, filters);
}

export async function getSalaryBands(query: SalaryBandsQuery, role: Role): Promise<SalaryBands> {
  const { view, buckets, ...filters } = query;
  const source = repository.salarySource(view);
  const meta = await metaFor(view, filters);
  const currency = view === 'usd' ? 'USD' : (filters.currency as string);

  const { headcount, min, max } = await repository.getSalaryRange(filters, source);

  // Too small a set would expose individual salaries as the range and bucket edges.
  if (headcount === 0 || !canSeeGroup(headcount, role)) {
    return { ...meta, currency, headcount: 0, buckets: [], suppressed: headcount > 0 };
  }

  const counts = await repository.getBucketCounts(filters, source, min, max, buckets);
  return {
    ...meta,
    currency,
    headcount,
    buckets: buildBuckets(min, max, buckets, counts),
    suppressed: false,
  };
}

export async function getTenure(query: TenureQuery, role: Role): Promise<TenureSummary> {
  const { view, ...filters } = query;

  const asOf = new Date().toISOString().slice(0, 10);
  const bands = await repository.getTenureBands(filters, repository.salarySource(view), asOf);
  const { visible, suppressed } = limitGroupsForRole(bands, role);

  return { ...(await metaFor(view, filters)), bands: visible, suppressedGroups: suppressed };
}

// Outliers are individuals with salaries, so HR only. The route already requires
// HR_MANAGER; this repeats it so the service is safe if it is ever wired elsewhere.
export async function getOutliers(query: OutliersQuery, role: Role): Promise<OutlierList> {
  if (role !== 'HR_MANAGER') throw new ForbiddenError();

  const { limit, ...filters } = query;
  return repository.getOutliers(filters, limit);
}
