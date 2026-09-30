import { describe, expect, it } from 'vitest';

import type { Employee } from '@api/generated/prisma/client.js';
import { exportColumnsFor } from '@api/modules/employees/employees.export.js';

const row: Employee = {
  id: 'emp-1',
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  jobTitle: 'Engineer',
  department: 'Engineering',
  country: 'GB',
  currency: 'GBP',
  salary: 9_000_000,
  employmentType: 'FULL_TIME',
  hireDate: new Date('2020-01-15'),
  createdAt: new Date('2020-02-01'),
  updatedAt: new Date('2020-03-01'),
};

describe('exportColumnsFor', () => {
  it('includes salary for an HR_MANAGER, in its original position', () => {
    const headers = exportColumnsFor('HR_MANAGER').map((column) => column.header);

    expect(headers).toEqual([
      'id',
      'fullName',
      'email',
      'jobTitle',
      'department',
      'country',
      'currency',
      'salary',
      'employmentType',
      'hireDate',
    ]);
  });

  it('drops salary from the header and the cells for a VIEWER, leaving the rest in order', () => {
    const columns = exportColumnsFor('VIEWER');

    expect(columns.map((column) => column.header)).not.toContain('salary');
    expect(columns.map((column) => column.cell(row))).toEqual([
      'emp-1',
      'Ada Lovelace',
      'ada@example.com',
      'Engineer',
      'Engineering',
      'GB',
      'GBP',
      'FULL_TIME',
      '2020-01-15',
    ]);
  });

  it('uses the VIEWER column list for any unexpected role value', () => {
    const columns = exportColumnsFor('ADMIN' as 'VIEWER');

    expect(columns.map((column) => column.header)).not.toContain('salary');
  });
});
