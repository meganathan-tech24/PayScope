// Cells starting with one of these can be read as a formula by spreadsheet apps.
const FORMULA_TRIGGERS = ['=', '+', '-', '@', '\t', '\r'];

export type CsvCell = string | number | null | undefined;

export function neutralizeFormula(value: string): string {
  return FORMULA_TRIGGERS.some((prefix) => value.startsWith(prefix)) ? `'${value}` : value;
}

export function escapeCsvCell(cell: CsvCell): string {
  const text = neutralizeFormula(cell === null || cell === undefined ? '' : String(cell));
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

// RFC 4180 line ending.
export function toCsvRow(cells: CsvCell[]): string {
  return `${cells.map(escapeCsvCell).join(',')}\r\n`;
}
