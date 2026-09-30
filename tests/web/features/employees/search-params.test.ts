import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PARAMS,
  parseEmployeeParams,
  sortFieldsFor,
  toSearchParams,
} from '@web/features/employees/lib/search-params';

const parse = (query: string, role: 'HR_MANAGER' | 'VIEWER' = 'HR_MANAGER') =>
  parseEmployeeParams(new URLSearchParams(query), role);

describe('parseEmployeeParams', () => {
  it('uses the defaults for an empty query', () => {
    expect(parse('')).toEqual(DEFAULT_PARAMS);
  });

  it('reads every parameter', () => {
    expect(
      parse(
        'page=3&search=ada&country=gb&department=Finance&jobTitle=Analyst&sortBy=hireDate&sortDir=desc',
      ),
    ).toEqual({
      page: 3,
      search: 'ada',
      country: 'GB',
      department: 'Finance',
      jobTitle: 'Analyst',
      sortBy: 'hireDate',
      sortDir: 'desc',
    });
  });

  it.each(['0', '-2', 'x', '1.5', '2000000', ''])('falls back to page 1 for page=%j', (page) => {
    expect(parse(`page=${page}`).page).toBe(1);
  });

  it('falls back for an unknown sort field and an unknown direction', () => {
    expect(parse('sortBy=passwordHash&sortDir=sideways')).toMatchObject({
      sortBy: 'fullName',
      sortDir: 'asc',
    });
  });

  it('allows sorting by salary for HR but not for a VIEWER (hand-typed URL)', () => {
    expect(parse('sortBy=salary', 'HR_MANAGER').sortBy).toBe('salary');
    expect(parse('sortBy=salary', 'VIEWER').sortBy).toBe('fullName');
    expect(sortFieldsFor('VIEWER')).not.toContain('salary');
    expect(sortFieldsFor('HR_MANAGER')).toContain('salary');
  });

  it('ignores a country that is not two letters and trims text', () => {
    expect(parse('country=Germany').country).toBe('');
    expect(parse('search=%20%20ada%20%20').search).toBe('ada');
  });
});

describe('toSearchParams', () => {
  it('leaves defaults out so URLs stay short', () => {
    expect(toSearchParams(DEFAULT_PARAMS).toString()).toBe('');
    expect(toSearchParams({ ...DEFAULT_PARAMS, page: 2, country: 'GB' }).toString()).toBe(
      'page=2&country=GB',
    );
  });

  it('round-trips through parse', () => {
    const params = {
      ...DEFAULT_PARAMS,
      page: 4,
      search: 'o brien',
      sortBy: 'salary',
      sortDir: 'desc' as const,
    };

    expect(parse(toSearchParams(params).toString())).toEqual(params);
  });
});
