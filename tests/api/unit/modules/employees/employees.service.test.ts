import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/modules/employees/employees.repository.js', () => ({
  listEmployees: vi.fn(),
  findEmployeeById: vi.fn(),
  createEmployee: vi.fn(),
  updateEmployee: vi.fn(),
  deleteEmployee: vi.fn(),
  streamEmployees: vi.fn(),
}));

import type { Employee } from '@api/generated/prisma/client.js';
import { NotFoundError } from '@api/lib/errors/app-error.js';
import * as repository from '@api/modules/employees/employees.repository.js';
import * as service from '@api/modules/employees/employees.service.js';

function buildRow(overrides: Partial<Employee> = {}): Employee {
  return {
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
    ...overrides,
  };
}

const query = { page: 1, pageSize: 25, sortBy: 'fullName', sortDir: 'asc' } as const;

afterEach(() => {
  vi.clearAllMocks();
});

describe('employees service, role-based shape', () => {
  it('lists without salary for a VIEWER and with it for an HR_MANAGER', async () => {
    vi.mocked(repository.listEmployees).mockResolvedValue({ items: [buildRow()], total: 1 });

    const viewerPage = await service.listEmployees(query, 'VIEWER');
    const hrPage = await service.listEmployees(query, 'HR_MANAGER');

    expect(viewerPage.items[0]).not.toHaveProperty('salary');
    expect(hrPage.items[0]).toHaveProperty('salary', 9_000_000);
    expect(viewerPage.meta).toEqual({ page: 1, pageSize: 25, total: 1, totalPages: 1 });
  });

  it('returns one employee without salary for a VIEWER and with it for an HR_MANAGER', async () => {
    vi.mocked(repository.findEmployeeById).mockResolvedValue(buildRow());

    expect(await service.getEmployee('emp-1', 'VIEWER')).not.toHaveProperty('salary');
    expect(await service.getEmployee('emp-1', 'HR_MANAGER')).toHaveProperty('salary', 9_000_000);
  });

  it('throws NotFoundError for a missing employee whatever the role', async () => {
    vi.mocked(repository.findEmployeeById).mockResolvedValue(null);

    await expect(service.getEmployee('nope', 'VIEWER')).rejects.toThrow(NotFoundError);
  });

  it('answers writes with the full shape', async () => {
    vi.mocked(repository.createEmployee).mockResolvedValue(buildRow());
    vi.mocked(repository.updateEmployee).mockResolvedValue(buildRow());

    const input = {} as Parameters<typeof service.createEmployee>[0];

    expect(await service.createEmployee(input)).toHaveProperty('salary', 9_000_000);
    expect(await service.updateEmployee('emp-1', input)).toHaveProperty('salary', 9_000_000);
  });
});
