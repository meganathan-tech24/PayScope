import { describe, expect, it } from 'vitest';

import { APPROXIMATE_USD_RATES, isRateCurrency } from '../fx-rates.js';
import { isIsoCurrencyCode } from '../iso-codes.js';

describe('APPROXIMATE_USD_RATES', () => {
  it('uses 1 for USD and a positive rate for every currency', () => {
    expect(APPROXIMATE_USD_RATES.USD).toBe(1);
    for (const rate of Object.values(APPROXIMATE_USD_RATES)) {
      expect(rate).toBeGreaterThan(0);
    }
  });

  it('only contains real ISO 4217 currency codes', () => {
    for (const code of Object.keys(APPROXIMATE_USD_RATES)) {
      expect(isIsoCurrencyCode(code)).toBe(true);
    }
  });
});

describe('isRateCurrency', () => {
  it('recognises listed currencies and rejects others', () => {
    expect(isRateCurrency('EUR')).toBe(true);
    expect(isRateCurrency('CHF')).toBe(false);
    expect(isRateCurrency('toString')).toBe(false);
  });
});
