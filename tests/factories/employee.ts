export function buildEmployeeInput(overrides: Record<string, unknown> = {}) {
  return {
    fullName: 'Ada Lovelace',
    email: 'ada@example.com',
    jobTitle: 'Engineer',
    department: 'Engineering',
    country: 'GB',
    currency: 'GBP',
    salary: 9_000_000,
    employmentType: 'FULL_TIME',
    hireDate: '2020-01-15',
    ...overrides,
  };
}
