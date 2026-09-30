import type { EmployeeDirectory, EmployeeFull, Role } from '@payscope/types';

import type { Employee } from './employees.types.js';

// Explicit allowlist, not "the row minus salary": a column added to the Employee
// model later stays hidden from VIEWERs until someone deliberately lists it here.
function toDirectory(employee: Employee): EmployeeDirectory {
  return {
    id: employee.id,
    fullName: employee.fullName,
    email: employee.email,
    jobTitle: employee.jobTitle,
    department: employee.department,
    country: employee.country,
    currency: employee.currency,
    employmentType: employee.employmentType,
    hireDate: employee.hireDate.toISOString(),
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
  };
}

// The only way a database row becomes a response. Salary is opt-in per role:
// anything that is not exactly HR_MANAGER (including an unexpected value in a
// token) gets the directory shape.
export function serializeEmployee(employee: Employee, role: 'HR_MANAGER'): EmployeeFull;
export function serializeEmployee(employee: Employee, role: 'VIEWER'): EmployeeDirectory;
export function serializeEmployee(employee: Employee, role: Role): EmployeeFull | EmployeeDirectory;
export function serializeEmployee(
  employee: Employee,
  role: Role,
): EmployeeFull | EmployeeDirectory {
  const directory = toDirectory(employee);
  return role === 'HR_MANAGER' ? { ...directory, salary: employee.salary } : directory;
}
