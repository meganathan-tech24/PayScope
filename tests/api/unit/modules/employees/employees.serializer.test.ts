import type { Role } from '@payscope/types';
import { describe, expect, it } from 'vitest';

import type { Employee } from '@api/generated/prisma/client.js';
import { serializeEmployee } from '@api/modules/employees/employees.serializer.js';
import { employeeDirectorySchema, employeeFullSchema } from '@shared/index.js';

const row: Employee = {
  id: '00000000-0000-4000-8000-000000000001',
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  jobTitle: 'Engineer',
  department: 'Engineering',
  country: 'GB',
  currency: 'GBP',
  salary: 9_000_000,
  employmentType: 'FULL_TIME',
  hireDate: new Date('2020-01-15'),
  createdAt: new Date('2020-02-01T10:00:00Z'),
  updatedAt: new Date('2020-03-01T10:00:00Z'),
};

describe('serializeEmployee', () => {
  it('gives HR_MANAGER the full shape including salary', () => {
    const result = serializeEmployee(row, 'HR_MANAGER');

    expect(employeeFullSchema.parse(result)).toEqual(result);
    expect(result.salary).toBe(9_000_000);
  });

  it('gives VIEWER the directory shape with no salary key at all', () => {
    const result = serializeEmployee(row, 'VIEWER');

    expect(employeeDirectorySchema.strict().safeParse(result).success).toBe(true);
    expect('salary' in result).toBe(false);
    expect(JSON.stringify(result)).not.toContain('salary');
  });

  it('writes dates as ISO strings, as the JSON response carries them', () => {
    const result = serializeEmployee(row, 'HR_MANAGER');

    expect(result.hireDate).toBe('2020-01-15T00:00:00.000Z');
    expect(result.createdAt).toBe('2020-02-01T10:00:00.000Z');
  });

  it('hides a column added to the row later (allowlist, not omit-salary)', () => {
    const withNewColumn = { ...row, bonus: 1234 } as Employee;

    const result = serializeEmployee(withNewColumn, 'VIEWER');

    expect(result).not.toHaveProperty('bonus');
    expect(employeeDirectorySchema.strict().safeParse(result).success).toBe(true);
  });

  it('falls back to the directory shape for an unexpected role value', () => {
    const result = serializeEmployee(row, 'ADMIN' as Role);

    expect('salary' in result).toBe(false);
  });

  it('does not mutate the source row', () => {
    const copy = { ...row };

    serializeEmployee(row, 'VIEWER');

    expect(row).toEqual(copy);
  });
});
