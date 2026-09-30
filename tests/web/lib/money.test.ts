import { describe, expect, it } from 'vitest';

import { currencyDigits, formatMoney, fromMinorUnits, toMinorUnits } from '@web/lib/money';

describe('formatMoney', () => {
  it('divides by the currency’s own minor unit: cents for USD, none for JPY', () => {
    expect(formatMoney(8_500_000, 'USD')).toBe('$85,000.00');
    expect(formatMoney(15_000_000, 'JPY')).toBe('¥15,000,000');
  });

  it('handles a three-digit currency', () => {
    expect(formatMoney(1_234_567, 'KWD')).toMatch(/1,234\.567/);
  });

  it('formats each amount in its own currency', () => {
    expect(formatMoney(7_800_000, 'GBP')).toBe('£78,000.00');
    expect(formatMoney(9_200_000, 'EUR')).toBe('€92,000.00');
    expect(formatMoney(840_000_000, 'INR')).toMatch(/8,400,000\.00/);
  });

  it('shows a zero amount and keeps large amounts exact', () => {
    expect(formatMoney(0, 'USD')).toBe('$0.00');
    expect(formatMoney(2_000_000_000, 'USD')).toBe('$20,000,000.00');
  });

  it('falls back to the code and a plain number for an unusable currency', () => {
    expect(formatMoney(1234, 'X')).toBe('X 12.34');
  });
});

describe('currencyDigits', () => {
  it('reads the digits from the currency, and defaults to 2 for an invalid code', () => {
    expect(currencyDigits('JPY')).toBe(0);
    expect(currencyDigits('USD')).toBe(2);
    expect(currencyDigits('KWD')).toBe(3);
    expect(currencyDigits('X')).toBe(2);
  });
});

describe('toMinorUnits', () => {
  it.each([
    ['85000', 'USD', 8_500_000],
    ['85,000.5', 'USD', 8_500_050],
    [' 0.07 ', 'USD', 7],
    ['15000000', 'JPY', 15_000_000],
    ['1.234', 'KWD', 1234],
  ])('turns %s %s into %i minor units', (text, currency, expected) => {
    expect(toMinorUnits(text, currency)).toBe(expected);
  });

  it.each([
    ['', 'USD'],
    ['abc', 'USD'],
    ['-5', 'USD'],
    ['1.2.3', 'USD'],
    ['85000.555', 'USD'],
    ['15000.5', 'JPY'],
  ])('rejects %j for %s', (text, currency) => {
    expect(toMinorUnits(text, currency)).toBeNull();
  });
});

describe('fromMinorUnits', () => {
  it('produces plain decimal text that toMinorUnits reads back', () => {
    expect(fromMinorUnits(8_500_050, 'USD')).toBe('85000.50');
    expect(fromMinorUnits(1500, 'JPY')).toBe('1500');
    for (const [minor, currency] of [
      [8_500_050, 'USD'],
      [1500, 'JPY'],
      [1234, 'KWD'],
    ] as const) {
      expect(toMinorUnits(fromMinorUnits(minor, currency), currency)).toBe(minor);
    }
  });
});
