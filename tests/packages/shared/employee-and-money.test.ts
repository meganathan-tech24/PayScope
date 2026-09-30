import { describe, expect, it } from 'vitest';

import { employeeBodySchema, EMPLOYMENT_TYPES, MAX_SALARY_MINOR_UNITS } from '@shared/employee.js';
import { listCountryCodes } from '@shared/iso-codes.js';
import { minorUnitExponent } from '@shared/minor-units.js';

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

describe('shared employee schema', () => {
  it('accepts a valid employee and lists the employment types', () => {
    expect(employeeBodySchema.safeParse(valid).success).toBe(true);
    expect([...EMPLOYMENT_TYPES]).toEqual(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']);
  });

  it('rejects a fractional, negative or unrealistic salary', () => {
    expect(employeeBodySchema.safeParse({ ...valid, salary: 1.5 }).success).toBe(false);
    expect(employeeBodySchema.safeParse({ ...valid, salary: -1 }).success).toBe(false);
    expect(
      employeeBodySchema.safeParse({ ...valid, salary: MAX_SALARY_MINOR_UNITS + 1 }).success,
    ).toBe(false);
  });
});

describe('listCountryCodes', () => {
  it('returns sorted two-letter codes including the ones the seed uses', () => {
    const codes = listCountryCodes();

    expect(codes).toEqual([...codes].sort());
    expect(codes).toEqual(expect.arrayContaining(['GB', 'DE', 'IN', 'JP', 'US']));
    expect(codes.every((code) => /^[A-Z]{2}$/.test(code))).toBe(true);
  });
});

describe('minorUnitExponent', () => {
  it('uses the currency’s own number of fraction digits', () => {
    expect(minorUnitExponent('JPY')).toBe(0);
    expect(minorUnitExponent('USD')).toBe(2);
    expect(minorUnitExponent('KWD')).toBe(3);
  });
});
