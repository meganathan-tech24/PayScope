import { describe, expect, it } from 'vitest';

import { bandWidth, fixedBandEdges, widenBandWidth } from '@shared/salary-bands.js';

describe('bandWidth', () => {
  it.each([
    ['USD', 2_500_000], // 25,000 dollars, in cents
    ['GBP', 2_000_000], // about 19,500 pounds -> 20,000
    ['EUR', 2_500_000], // about 23,000 euros -> 25,000
    ['INR', 200_000_000], // about 2.1 million rupees -> 2,000,000
    ['JPY', 5_000_000], // about 3.75 million yen -> 5,000,000 whole yen (no minor unit)
    ['AUD', 5_000_000], // about 37,500 -> 50,000
  ])('is a round step per currency: %s', (currency, expected) => {
    expect(bandWidth(currency)).toBe(expected);
  });

  it('falls back to 10,000 major units for a currency with no rate, honouring its minor unit', () => {
    expect(bandWidth('CHF')).toBe(1_000_000);
    expect(bandWidth('KWD')).toBe(10_000_000);
  });
});

describe('widenBandWidth', () => {
  it('climbs the 1, 2, 2.5, 5 ladder and rolls over to the next power of ten', () => {
    expect(widenBandWidth(100)).toBe(200);
    expect(widenBandWidth(200)).toBe(250);
    expect(widenBandWidth(250)).toBe(500);
    expect(widenBandWidth(500)).toBe(1000);
    expect(widenBandWidth(2_500_000)).toBe(5_000_000);
    expect(widenBandWidth(5_000_000)).toBe(10_000_000);
  });
});

describe('fixedBandEdges', () => {
  it('lays edges on multiples of the width that cover the range', () => {
    // 12,345.67 to 112,233.45 pounds, in pence, with a 20,000-pound step.
    const { width, lo, count } = fixedBandEdges(1_234_567, 11_223_345, 'GBP', 10);

    expect(width).toBe(2_000_000);
    expect(lo).toBe(0);
    expect(count).toBe(6);
    expect(lo + count * width).toBe(12_000_000);
  });

  it('widens the step until at most the requested number of bands is needed', () => {
    const { width, count } = fixedBandEdges(500_000, 1_900_000_000, 'GBP', 10);

    expect(count).toBeLessThanOrEqual(10);
    expect(width).toBeGreaterThan(2_000_000);
    expect(width % 500_000).toBe(0);
  });

  it('always covers the lowest and highest salary, on edges that are multiples of the width', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const min = (seed * 7_919_113) % 900_000_000;
      const max = min + ((seed * 104_729) % 1_000_000_000);
      const currency = ['USD', 'GBP', 'EUR', 'JPY', 'INR', 'CHF'][seed % 6] as string;
      const buckets = 2 + (seed % 29);

      const { width, lo, count } = fixedBandEdges(min, max, currency, buckets);

      expect(lo % width).toBe(0);
      expect(lo).toBeLessThanOrEqual(min);
      expect(lo + count * width).toBeGreaterThan(max);
      expect(count).toBeGreaterThanOrEqual(1);
      expect(count).toBeLessThanOrEqual(buckets);
    }
  });

  it('gives one band for a group whose salaries are all equal', () => {
    expect(fixedBandEdges(4_321_099, 4_321_099, 'GBP', 10).count).toBe(1);
  });
});
