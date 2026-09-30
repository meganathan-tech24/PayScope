import { describe, expect, it } from 'vitest';

import { employeeDirectorySchema, employeeFullSchema, ROLES } from '@shared/index.js';

const directory = {
  id: '00000000-0000-4000-8000-000000000001',
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  jobTitle: 'Engineer',
  department: 'Engineering',
  country: 'GB',
  currency: 'GBP',
  employmentType: 'FULL_TIME',
  hireDate: '2020-01-15T00:00:00.000Z',
  createdAt: '2020-01-15T00:00:00.000Z',
  updatedAt: '2020-01-15T00:00:00.000Z',
};

describe('ROLES', () => {
  it('lists exactly the two supported roles', () => {
    expect([...ROLES]).toEqual(['HR_MANAGER', 'VIEWER']);
  });
});

describe('employeeDirectorySchema', () => {
  it('accepts a directory employee', () => {
    expect(employeeDirectorySchema.safeParse(directory).success).toBe(true);
  });

  it('rejects a salary key, even null', () => {
    expect(employeeDirectorySchema.safeParse({ ...directory, salary: 1 }).success).toBe(false);
    expect(employeeDirectorySchema.safeParse({ ...directory, salary: null }).success).toBe(false);
  });
});

describe('employeeFullSchema', () => {
  it('accepts an employee with a salary', () => {
    expect(employeeFullSchema.safeParse({ ...directory, salary: 9_000_000 }).success).toBe(true);
  });

  it('requires the salary', () => {
    expect(employeeFullSchema.safeParse(directory).success).toBe(false);
  });
});
