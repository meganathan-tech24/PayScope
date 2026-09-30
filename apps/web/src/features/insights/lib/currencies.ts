export interface CurrencyOption {
  code: string;
  /** How many employees are paid in it: a count, never an amount. */
  headcount: number;
}

// The currencies present in the data, most-used first. Only counts are compared here;
// amounts in different currencies are never added or ranked.
export function currencyOptions(rows: { currency: string; headcount: number }[]): CurrencyOption[] {
  const totals = new Map<string, number>();
  for (const row of rows) totals.set(row.currency, (totals.get(row.currency) ?? 0) + row.headcount);
  return [...totals]
    .map(([code, headcount]) => ({ code, headcount }))
    .sort((a, b) => b.headcount - a.headcount || a.code.localeCompare(b.code));
}

/** The requested currency if it exists in the data, otherwise the most-used one. */
export function resolveCurrency(requested: string, options: CurrencyOption[]): string {
  return options.find((option) => option.code === requested)?.code ?? options[0]?.code ?? '';
}
