import { minorUnitExponent } from './minor-units.js';

// Static, illustrative "units of currency per 1 USD". Not live rates: they exist so
// seeded salaries look plausible and so an org-wide USD view can be shown, always
// labelled approximate. Update by hand; never fetched at runtime.
export const APPROXIMATE_USD_RATES = {
  USD: 1,
  GBP: 0.78,
  EUR: 0.92,
  INR: 84,
  JPY: 150,
  BRL: 5.5,
  CAD: 1.36,
  AUD: 1.5,
} as const;

export type RateCurrency = keyof typeof APPROXIMATE_USD_RATES;

export function isRateCurrency(code: string): code is RateCurrency {
  return Object.hasOwn(APPROXIMATE_USD_RATES, code);
}

// For SQL: a salary in minor units of `currency` is `salary * 100 / divisor` US cents,
// where divisor = 10^(minor-unit digits) * (units of currency per USD).
export function usdConversionTable(): { currencies: string[]; divisors: number[] } {
  const currencies = Object.keys(APPROXIMATE_USD_RATES);
  return {
    currencies,
    divisors: currencies.map(
      (code) => 10 ** minorUnitExponent(code) * APPROXIMATE_USD_RATES[code as RateCurrency],
    ),
  };
}
