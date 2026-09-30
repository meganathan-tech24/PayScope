import { countryName, employmentTypeLabel } from '../../employees/lib/format';

export type Dimension = 'country' | 'jobTitle' | 'department' | 'employmentType';

export const DIMENSION_LABEL: Record<Dimension, string> = {
  country: 'Country',
  jobTitle: 'Job title',
  department: 'Department',
  employmentType: 'Employment type',
};

/** How a group key is shown to a person: "Germany", "Full time", or the name itself. */
export function groupLabel(dimension: Dimension, key: string): string {
  if (dimension === 'country') return countryName(key);
  if (dimension === 'employmentType') return employmentTypeLabel(key);
  return key;
}

/** Long names are cut for a narrow chart axis; the full name is in the table and tooltip. */
export function truncate(text: string, max = 18): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** Sizes a horizontal bar chart to its rows so labels never crowd. */
export function chartHeight(rows: number, rowHeight = 40, padding = 56): number {
  return Math.max(160, rows * rowHeight + padding);
}

// The bars show a range, not a size from zero, so the axis starts a little below the lowest
// 25th percentile (rounded down to two significant figures) instead of wasting the width.
export function axisStart(lowestP25: number): number {
  if (lowestP25 <= 0) return 0;
  const target = lowestP25 * 0.8;
  const step = 10 ** (Math.floor(Math.log10(target)) - 1);
  return Math.floor(target / step) * step;
}
