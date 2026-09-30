import type { InsightStats, Role } from '@payscope/types';

import { ValidationError } from '../../lib/errors/app-error.js';

import { limitGroupsForRole } from './insights.access.js';
import * as repository from './insights.repository.js';
import type { StatsQuery } from './insights.schema.js';

export async function getStats(query: StatsQuery, role: Role): Promise<InsightStats> {
  const { groupBy, view, ...filters } = query;
  if (groupBy === 'org' || view !== 'native') {
    throw new ValidationError('The USD view is not available yet');
  }

  const groups = await repository.getStats(groupBy, filters);
  const { visible, suppressed } = limitGroupsForRole(groups, role);

  return { view: 'native', approximate: false, rows: visible, suppressedGroups: suppressed };
}
