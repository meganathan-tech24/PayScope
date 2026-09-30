import { APPROXIMATE_USD_RATES, isRateCurrency } from './fx-rates.js';
import { minorUnitExponent } from './minor-units.js';

// Salary bands for someone who may not learn individual salaries. Their edges must not come
// from the group's real minimum and maximum (those are two people's salaries), so they sit on
// fixed, rounded steps: multiples of a width chosen per currency. What remains is that the
// range is known to within one step.

const BASE_USD_MAJOR = 25_000;
const UNKNOWN_CURRENCY_MAJOR = 10_000;
// Widths are 1, 2, 2.5 or 5 times a power of ten.
const LADDER = [1, 2, 2.5, 5] as const;

function nearestLadderValue(target: number): number {
  const exponent = Math.floor(Math.log10(target));
  const candidates = [-1, 0, 1].flatMap((shift) =>
    LADDER.map((mantissa) => mantissa * 10 ** (exponent + shift)),
  );
  return candidates.reduce((best, value) =>
    Math.abs(Math.log(value / target)) < Math.abs(Math.log(best / target)) ? value : best,
  );
}

/** The band width for a currency in minor units: about 25,000 US dollars, rounded to the ladder. */
export function bandWidth(currency: string): number {
  const major = isRateCurrency(currency)
    ? nearestLadderValue(BASE_USD_MAJOR * APPROXIMATE_USD_RATES[currency])
    : UNKNOWN_CURRENCY_MAJOR;
  return major * 10 ** minorUnitExponent(currency);
}

/** The next width up the same ladder: 1, 2, 2.5, 5, then 10 times the power of ten. */
export function widenBandWidth(width: number): number {
  const exponent = Math.floor(Math.log10(width));
  const mantissa = Math.round((width / 10 ** exponent) * 100) / 100;
  const next = LADDER.find((step) => step > mantissa);
  return next === undefined ? 10 ** (exponent + 1) : next * 10 ** exponent;
}

export interface FixedBands {
  /** Every edge is a multiple of this. */
  width: number;
  /** First edge: at or below the lowest salary. */
  lo: number;
  /** Number of bands; the last edge is lo + count * width, above the highest salary. */
  count: number;
}

/**
 * Lays fixed edges over a salary range. The range only decides how far the edges have to
 * reach; the width widens along the ladder until at most `maxBuckets` bands are needed.
 * Only the edges are ever shown, never `min` or `max` themselves.
 */
export function fixedBandEdges(
  min: number,
  max: number,
  currency: string,
  maxBuckets: number,
): FixedBands {
  let width = bandWidth(currency);
  for (;;) {
    const lo = Math.floor(min / width) * width;
    const hi = (Math.floor(max / width) + 1) * width;
    const count = Math.round((hi - lo) / width);
    if (count <= maxBuckets) return { width, lo, count };
    width = widenBandWidth(width);
  }
}
