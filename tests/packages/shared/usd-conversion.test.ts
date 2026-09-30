import { describe, expect, it } from 'vitest';

import { APPROXIMATE_USD_RATES, usdConversionTable } from '@shared/fx-rates.js';

describe('usdConversionTable', () => {
  const { currencies, divisors } = usdConversionTable();
  const divisorOf = (code: string) => divisors[currencies.indexOf(code)];

  it('lists exactly the currencies in the rate table, with one divisor each', () => {
    expect([...currencies].sort()).toEqual(Object.keys(APPROXIMATE_USD_RATES).sort());
    expect(divisors).toHaveLength(currencies.length);
  });

  it('turns minor units into US cents: cents = minor * 100 / divisor', () => {
    expect(divisorOf('USD')).toBeCloseTo(100);
    expect(divisorOf('GBP')).toBeCloseTo(78);
    expect(divisorOf('EUR')).toBeCloseTo(92);
  });

  it('accounts for currencies without minor units (JPY has none)', () => {
    expect(divisorOf('JPY')).toBeCloseTo(150);
  });
});
