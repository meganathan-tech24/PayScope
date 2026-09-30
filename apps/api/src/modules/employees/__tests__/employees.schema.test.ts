import { describe, expect, it } from 'vitest';

import {
  employeeBodySchema,
  employeeIdParamsSchema,
  listEmployeesQuerySchema,
  MAX_SALARY_MINOR_UNITS,
} from '../employees.schema.js';

const valid = {
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  jobTitle: 'Engineer',
  department: 'Engineering',
  country: 'GB',
  currency: 'GBP',
  salary: 9_000_000,
  employmentType: 'FULL_TIME',
  hireDate: '2020-01-15',
};

const rejects = (overrides: Record<string, unknown>) =>
  employeeBodySchema.safeParse({ ...valid, ...overrides }).success;

describe('employeeBodySchema', () => {
  it('accepts a valid payload', () => {
    expect(employeeBodySchema.safeParse(valid).success).toBe(true);
  });

  it('trims and lowercases the email, uppercases country and currency', () => {
    const parsed = employeeBodySchema.parse({
      ...valid,
      email: '  Ada@Example.COM ',
      country: 'gb',
      currency: 'gbp',
    });

    expect(parsed).toMatchObject({ email: 'ada@example.com', country: 'GB', currency: 'GBP' });
  });

  it.each([
    ['blank fullName', { fullName: '   ' }],
    ['invalid email', { email: 'not-an-email' }],
    ['unknown country', { country: 'ZZ' }],
    ['3-letter country', { country: 'GBR' }],
    ['unknown currency', { currency: 'XYZ' }],
    ['negative salary', { salary: -1 }],
    ['fractional salary', { salary: 10.5 }],
    ['salary over the cap', { salary: MAX_SALARY_MINOR_UNITS + 1 }],
    ['string salary', { salary: '9000000' }],
    ['unknown employmentType', { employmentType: 'FREELANCE' }],
    ['unparseable hireDate', { hireDate: 'not-a-date' }],
    ['future hireDate', { hireDate: '2999-01-01' }],
  ])('rejects %s', (_label, overrides) => {
    expect(rejects(overrides)).toBe(false);
  });

  it('accepts a salary of 0 and of exactly the cap', () => {
    expect(rejects({ salary: 0 })).toBe(true);
    expect(rejects({ salary: MAX_SALARY_MINOR_UNITS })).toBe(true);
  });

  it('rejects unknown fields instead of dropping them', () => {
    expect(rejects({ role: 'HR_MANAGER' })).toBe(false);
  });

  it('rejects a missing required field', () => {
    const { jobTitle: _omit, ...withoutJobTitle } = valid;

    expect(employeeBodySchema.safeParse(withoutJobTitle).success).toBe(false);
  });
});

describe('employeeIdParamsSchema', () => {
  it('accepts a UUID and rejects anything else', () => {
    expect(
      employeeIdParamsSchema.safeParse({ id: '2ad7edb7-c8d1-485f-ba3a-e9413f08b82f' }).success,
    ).toBe(true);
    expect(employeeIdParamsSchema.safeParse({ id: '123' }).success).toBe(false);
  });
});

describe('listEmployeesQuerySchema', () => {
  it('applies defaults', () => {
    expect(listEmployeesQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 25,
      sortBy: 'fullName',
      sortDir: 'asc',
    });
  });

  it('clamps pageSize over the max to 100 instead of rejecting', () => {
    expect(listEmployeesQuerySchema.parse({ pageSize: '500' }).pageSize).toBe(100);
  });

  it.each([
    ['page 0', { page: '0' }],
    ['non-numeric page', { page: 'abc' }],
    ['pageSize 0', { pageSize: '0' }],
    ['sortBy outside the whitelist', { sortBy: 'passwordHash' }],
    ['bad sortDir', { sortDir: 'sideways' }],
    ['bad country filter', { country: 'ZZ' }],
    ['unknown query param', { foo: 'bar' }],
  ])('rejects %s', (_label, query) => {
    expect(listEmployeesQuerySchema.safeParse(query).success).toBe(false);
  });

  it('treats blank filters as absent and normalizes the country filter', () => {
    const parsed = listEmployeesQuerySchema.parse({ search: '  ', department: '', country: 'us' });

    expect(parsed.search).toBeUndefined();
    expect(parsed.department).toBeUndefined();
    expect(parsed.country).toBe('US');
  });
});
