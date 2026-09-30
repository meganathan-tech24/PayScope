import { prisma } from '@api/database/prisma.js';

export interface EmployeeRowSpec {
  country: string;
  currency: string;
  jobTitle: string;
  department?: string;
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  salary: number;
  hireDate?: string;
  fullName?: string;
}

let counter = 0;

// Inserts employees straight into the test database (reset after every test), so
// insight tests can hand-check numbers on a tiny known dataset.
export async function seedEmployees(specs: EmployeeRowSpec[]): Promise<void> {
  await prisma.employee.createMany({
    data: specs.map((spec) => {
      counter += 1;
      return {
        fullName: spec.fullName ?? `Person ${counter}`,
        email: `insight${counter}@example.com`,
        jobTitle: spec.jobTitle,
        department: spec.department ?? 'Engineering',
        country: spec.country,
        currency: spec.currency,
        salary: spec.salary,
        employmentType: spec.employmentType ?? 'FULL_TIME',
        hireDate: new Date(spec.hireDate ?? '2020-01-15'),
      };
    }),
  });
}

// Repeats one spec once per salary.
export const withSalaries = (
  base: Omit<EmployeeRowSpec, 'salary'>,
  salaries: number[],
): EmployeeRowSpec[] => salaries.map((salary) => ({ ...base, salary }));
