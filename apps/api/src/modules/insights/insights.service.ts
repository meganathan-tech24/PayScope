import type { HeadcountRow, InsightStats, Role, SalaryBands } from '@payscope/types';

import { ValidationError } from '../../lib/errors/app-error.js';

import { canSeeGroup, limitGroupsForRole } from './insights.access.js';
import { buildBuckets } from './insights.bands.js';
import * as repository from './insights.repository.js';
import type { HeadcountQuery, SalaryBandsQuery, StatsQuery } from './insights.schema.js';

export async function getStats(query: StatsQuery, role: Role): Promise<InsightStats> {
  const { groupBy, view, ...filters } = query;
  if (groupBy === 'org' || view !== 'native') {
    throw new ValidationError('The USD view is not available yet');
  }

  const groups = await repository.getStats(groupBy, filters);
  const { visible, suppressed } = limitGroupsForRole(groups, role);

  return { view: 'native', approximate: false, rows: visible, suppressedGroups: suppressed };
}

// Headcount carries no salary data, so every role sees every group.
export async function getHeadcount(query: HeadcountQuery): Promise<HeadcountRow[]> {
  const { by, ...filters } = query;
  return repository.getHeadcount(by, filters);
}

export async function getSalaryBands(query: SalaryBandsQuery, role: Role): Promise<SalaryBands> {
  const { view, buckets, ...filters } = query;
  if (view !== 'native' || !filters.currency) {
    throw new ValidationError('The USD view is not available yet');
  }

  const { headcount, min, max } = await repository.getSalaryRange(filters);
  const meta = { view, approximate: false, currency: filters.currency } as const;

  // Too small a set would expose individual salaries as the range and bucket edges.
  if (headcount === 0 || !canSeeGroup(headcount, role)) {
    return { ...meta, headcount: 0, buckets: [], suppressed: headcount > 0 };
  }

  const counts = await repository.getBucketCounts(filters, min, max, buckets);
  return {
    ...meta,
    headcount,
    buckets: buildBuckets(min, max, buckets, counts),
    suppressed: false,
  };
}
