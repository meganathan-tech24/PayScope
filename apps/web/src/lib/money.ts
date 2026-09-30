import { minorUnitExponent } from '@payscope/shared/money';

// Salaries are integers in the currency's minor units, and currencies differ: USD has 2
// fraction digits, JPY none, KWD three. The divisor always comes from the currency itself,
// never from a hard-coded 100, and amounts in different currencies are never added.

/** Fraction digits of a currency; an invalid code falls back to 2 instead of throwing. */
export function currencyDigits(currency: string): number {
  try {
    return minorUnitExponent(currency);
  } catch {
    return 2;
  }
}

export function formatMoney(minorUnits: number, currency: string, locale = 'en'): string {
  const amount = minorUnits / 10 ** currencyDigits(currency);
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(currencyDigits(currency))}`;
  }
}

/** Plain decimal text for an input, e.g. 8500050 USD -> "85000.50", 1500 JPY -> "1500". */
export function fromMinorUnits(minorUnits: number, currency: string): string {
  return (minorUnits / 10 ** currencyDigits(currency)).toFixed(currencyDigits(currency));
}

/**
 * Parses what a person types ("85,000.50") into integer minor units, or null when it is
 * not a plain non-negative amount or has more decimals than the currency allows.
 */
export function toMinorUnits(text: string, currency: string): number | null {
  const cleaned = text.replace(/[,\s]/g, '');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;

  const digits = currencyDigits(currency);
  const [whole = '0', fraction = ''] = cleaned.split('.');
  if (fraction.length > digits) return null;

  return Number(whole) * 10 ** digits + Number(fraction.padEnd(digits, '0') || 0);
}

/** Short amounts for chart axes and tight spaces: "$85K", "¥15M". Not for exact figures. */
export function formatMoneyCompact(minorUnits: number, currency: string, locale = 'en'): string {
  const amount = minorUnits / 10 ** currencyDigits(currency);
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount)}`;
  }
}
