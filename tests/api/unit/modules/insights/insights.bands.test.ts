import { describe, expect, it } from 'vitest';

import { buildBuckets } from '@api/modules/insights/insights.bands.js';

describe('buildBuckets', () => {
  it('builds equal-width buckets with the maximum in the last one', () => {
    const counts = new Map([
      [1, 2],
      [2, 2],
      [3, 2],
      [4, 2],
      [5, 2],
    ]);

    expect(buildBuckets(1000, 10000, 5, counts)).toEqual([
      { from: 1000, to: 2801, count: 2 },
      { from: 2801, to: 4601, count: 2 },
      { from: 4601, to: 6401, count: 2 },
      { from: 6401, to: 8201, count: 2 },
      { from: 8201, to: 10000, count: 2 },
    ]);
  });

  it('fills empty buckets with 0', () => {
    const buckets = buildBuckets(0, 99, 4, new Map([[1, 5]]));

    expect(buckets.map((bucket) => bucket.count)).toEqual([5, 0, 0, 0]);
  });

  it('returns one bucket when every salary is the same', () => {
    expect(buildBuckets(5000, 5000, 10, new Map([[1, 7]]))).toEqual([
      { from: 5000, to: 5000, count: 7 },
    ]);
  });
});
