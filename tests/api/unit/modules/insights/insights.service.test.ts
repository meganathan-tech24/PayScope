import type { Role } from '@payscope/types';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/modules/insights/insights.repository.js', () => ({
  getOutliers: vi.fn(),
  getStats: vi.fn(),
  salarySource: vi.fn(),
  countWithoutRate: vi.fn(),
}));

import { ForbiddenError } from '@api/lib/errors/app-error.js';
import * as repository from '@api/modules/insights/insights.repository.js';
import * as service from '@api/modules/insights/insights.service.js';

afterEach(() => {
  vi.clearAllMocks();
});

describe('insights service, role rules', () => {
  it.each(['VIEWER', 'ADMIN'])(
    'refuses outliers to %s before touching the repository',
    async (role) => {
      await expect(service.getOutliers({ limit: 50 }, role as Role)).rejects.toThrow(
        ForbiddenError,
      );

      expect(repository.getOutliers).not.toHaveBeenCalled();
    },
  );

  it('returns outliers to an HR_MANAGER', async () => {
    vi.mocked(repository.getOutliers).mockResolvedValue({ total: 0, rows: [] });

    expect(await service.getOutliers({ limit: 50 }, 'HR_MANAGER')).toEqual({ total: 0, rows: [] });
  });

  it('drops groups under 5 for a VIEWER and reports how many, but keeps them for HR', async () => {
    const row = (key: string, headcount: number) => ({
      key,
      currency: 'GBP',
      headcount,
      min: 1,
      p25: 1,
      median: 1,
      avg: 1,
      p75: 1,
      max: 1,
    });
    vi.mocked(repository.getStats).mockResolvedValue([row('A', 2), row('B', 6)]);
    const query = { groupBy: 'country', view: 'native' } as const;

    const viewer = await service.getStats(query, 'VIEWER');
    const hr = await service.getStats(query, 'HR_MANAGER');

    expect(viewer.rows.map((r) => r.key)).toEqual(['B']);
    expect(viewer.suppressedGroups).toBe(1);
    expect(hr.rows).toHaveLength(2);
  });
});
