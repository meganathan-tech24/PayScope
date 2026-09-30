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
