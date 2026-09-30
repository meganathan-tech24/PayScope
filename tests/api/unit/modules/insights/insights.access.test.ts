import type { Role } from '@payscope/types';
import { describe, expect, it } from 'vitest';

import {
  canSeeGroup,
  limitGroupsForRole,
  MIN_GROUP_SIZE_FOR_VIEWER,
} from '@api/modules/insights/insights.access.js';

describe('canSeeGroup', () => {
  it('lets HR_MANAGER see any group, even one person', () => {
    expect(canSeeGroup(1, 'HR_MANAGER')).toBe(true);
  });

  it('lets a VIEWER see a group only from the minimum size upwards', () => {
    expect(canSeeGroup(MIN_GROUP_SIZE_FOR_VIEWER - 1, 'VIEWER')).toBe(false);
    expect(canSeeGroup(MIN_GROUP_SIZE_FOR_VIEWER, 'VIEWER')).toBe(true);
  });

  it('fails closed for an unexpected role value', () => {
    expect(canSeeGroup(1, 'ADMIN' as Role)).toBe(false);
  });
});

describe('limitGroupsForRole', () => {
  const groups = [{ headcount: 2 }, { headcount: 5 }, { headcount: 9 }];

  it('drops small groups for a VIEWER and counts them', () => {
    expect(limitGroupsForRole(groups, 'VIEWER')).toEqual({
      visible: [{ headcount: 5 }, { headcount: 9 }],
      suppressed: 1,
    });
  });

  it('keeps everything for an HR_MANAGER', () => {
    expect(limitGroupsForRole(groups, 'HR_MANAGER')).toEqual({ visible: groups, suppressed: 0 });
  });
});
