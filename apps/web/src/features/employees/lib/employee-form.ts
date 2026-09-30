import { employeeBodySchema } from '@payscope/shared/employee';

import { currencyDigits, toMinorUnits } from '../../../lib/money';
import type { EmployeeBody } from '../services/employees.service';

export interface EmployeeFormValues {
  fullName: string;
  email: string;
  jobTitle: string;
  department: string;
  country: string;
  currency: string;
  salary: string; // as typed, in major units ("85,000.50")
  employmentType: string;
  hireDate: string; // yyyy-mm-dd
}

export const EMPTY_FORM: EmployeeFormValues = {
  fullName: '',
  email: '',
  jobTitle: '',
  department: '',
  country: '',
  currency: '',
  salary: '',
  employmentType: 'FULL_TIME',
  hireDate: '',
};

export type FormErrors = Partial<Record<keyof EmployeeFormValues, string>>;

// The shared schema speaks in API field names; these say the same thing to a person.
function friendly(field: string, message: string, value: string): string {
  if (field === 'country' && !value) return 'Select a country';
  if (field === 'currency' && !value) return 'Select a currency';
  if (field === 'hireDate' && !value) return 'Enter the hire date';
  if (field === 'hireDate' && /future/i.test(message))
    return 'The hire date cannot be in the future';
  if (field === 'hireDate') return 'Enter a valid hire date';
  return message
    .replace(/^fullName /, 'Full name ')
    .replace(/^jobTitle /, 'Job title ')
    .replace(/^department /, 'Department ');
}

export function validateEmployeeForm(
  values: EmployeeFormValues,
): { body: EmployeeBody; errors?: undefined } | { body?: undefined; errors: FormErrors } {
  const errors: FormErrors = {};

  // Salary is typed in major units and stored in minor units of the chosen currency.
  const minor = toMinorUnits(values.salary, values.currency || 'USD');
  if (!values.salary.trim()) {
    errors.salary = 'Enter a salary';
  } else if (minor === null) {
    const digits = currencyDigits(values.currency || 'USD');
    errors.salary =
      digits === 0
        ? 'Enter a whole amount (this currency has no decimals)'
        : `Enter an amount with at most ${digits} decimals`;
  }

  const result = employeeBodySchema.safeParse({ ...values, salary: minor ?? 0 });
  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = String(issue.path[0]) as keyof EmployeeFormValues;
      if (field === 'salary' && errors.salary) continue;
      errors[field] ??= friendly(field, issue.message, values[field] ?? '');
    }
  }

  if (Object.keys(errors).length > 0 || !result.success) return { errors };
  return { body: { ...result.data, hireDate: values.hireDate } };
}
