// ISO 4217 minor-unit exponent (JPY 0, most currencies 2) straight from ICU.
const exponentCache = new Map<string, number>();

export function minorUnitExponent(currency: string): number {
  let exponent = exponentCache.get(currency);
  if (exponent === undefined) {
    exponent =
      new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
        .maximumFractionDigits ?? 2;
    exponentCache.set(currency, exponent);
  }
  return exponent;
}
