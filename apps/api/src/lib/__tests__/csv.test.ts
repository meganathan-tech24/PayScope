import { describe, expect, it } from 'vitest';

import { escapeCsvCell, neutralizeFormula, toCsvRow } from '../csv.js';

describe('neutralizeFormula', () => {
  it.each(['=SUM(1+1)', '+1', '-1', '@name'])('prefixes a single quote to %s', (value) => {
    expect(neutralizeFormula(value)).toBe(`'${value}`);
  });

  it.each(['\tindented', '\rreturn'])('also neutralizes a leading tab or carriage return', (v) => {
    expect(neutralizeFormula(v)).toBe(`'${v}`);
  });

  it.each(['Ada', '1+1', 'a=b', 'x@y.com', '', "'already quoted"])(
    'leaves %j untouched (only the first character matters)',
    (value) => {
      expect(neutralizeFormula(value)).toBe(value);
    },
  );
});

describe('escapeCsvCell', () => {
  it('leaves plain values unquoted', () => {
    expect(escapeCsvCell('Ada Lovelace')).toBe('Ada Lovelace');
  });

  it('quotes values containing a comma, quote or newline, doubling inner quotes', () => {
    expect(escapeCsvCell('Lovelace, Ada')).toBe('"Lovelace, Ada"');
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvCell('line1\nline2')).toBe('"line1\nline2"');
    expect(escapeCsvCell('line1\r\nline2')).toBe('"line1\r\nline2"');
  });

  it('renders numbers, null and undefined', () => {
    expect(escapeCsvCell(9_000_000)).toBe('9000000');
    expect(escapeCsvCell(0)).toBe('0');
    expect(escapeCsvCell(null)).toBe('');
    expect(escapeCsvCell(undefined)).toBe('');
  });

  it('neutralizes first, then quotes, when both apply', () => {
    expect(escapeCsvCell('=SUM(1,1)')).toBe(`"'=SUM(1,1)"`);
  });
});

describe('toCsvRow', () => {
  it('joins cells with commas and ends with CRLF', () => {
    expect(toCsvRow(['a', 'b,c', 3])).toBe('a,"b,c",3\r\n');
  });
});
