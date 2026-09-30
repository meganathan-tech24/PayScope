import type { FixedBands } from '@payscope/shared';
import type { SalaryBandBucket } from '@payscope/types';

// Splits [min, max] into `count` equal-width buckets, [from, to) each and the last
// one closed at max. Edges are rounded up: an integer salary is in a bucket exactly
// when it is at least the bucket's (ceiled) `from`. `bucketCounts` maps a 1-based
// width_bucket index to headcount.
// All-equal salaries give a single bucket instead of empty slivers.
export function buildBuckets(
  min: number,
  max: number,
  count: number,
  bucketCounts: Map<number, number>,
): SalaryBandBucket[] {
  if (min === max) {
    return [{ from: min, to: max, count: [...bucketCounts.values()].reduce((a, b) => a + b, 0) }];
  }

  // width_bucket is asked to cover [min, max + 1) so the maximum lands in the last bucket.
  const width = (max + 1 - min) / count;
  return Array.from({ length: count }, (_, index) => ({
    from: Math.ceil(min + index * width),
    to: index === count - 1 ? max : Math.ceil(min + (index + 1) * width),
    count: bucketCounts.get(index + 1) ?? 0,
  }));
}

// Bands on fixed edges (multiples of one width): what a VIEWER gets, so that no edge is a
// real person's salary. `bucketCounts` maps a 1-based width_bucket index to headcount.
export function buildFixedBuckets(
  { lo, width, count }: FixedBands,
  bucketCounts: Map<number, number>,
): SalaryBandBucket[] {
  return Array.from({ length: count }, (_, index) => ({
    from: lo + index * width,
    to: lo + (index + 1) * width,
    count: bucketCounts.get(index + 1) ?? 0,
  }));
}
