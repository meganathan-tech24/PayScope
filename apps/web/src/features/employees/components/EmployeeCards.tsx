import type { ReactNode } from 'react';

import { formatMoney } from '../../../lib/money';
import { countryName, formatDate } from '../lib/format';
import { hasSalary, type EmployeeRow } from '../types';

import { Avatar } from './Avatar';
import { EmploymentTypeBadge } from './EmploymentTypeBadge';

// Below the md breakpoint: one card per employee instead of a table that would scroll sideways.
export function EmployeeCards({
  employees,
  showSalary,
  renderActions,
  busy,
}: {
  employees: EmployeeRow[];
  showSalary: boolean;
  renderActions?: (employee: EmployeeRow, layout: 'row' | 'card') => ReactNode;
  busy: boolean;
}) {
  return (
    <ul
      aria-label="Employees"
      aria-busy={busy}
      className={['flex flex-col gap-3 md:hidden', busy ? 'opacity-60' : ''].join(' ')}
    >
      {employees.map((employee) => (
        <li key={employee.id} className="card flex flex-col gap-3 p-4">
          <div className="flex items-start gap-3">
            <Avatar name={employee.fullName} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-neutral-900" title={employee.fullName}>
                {employee.fullName}
              </p>
              <p className="truncate text-sm text-neutral-600" title={employee.email}>
                {employee.email}
              </p>
            </div>
            <EmploymentTypeBadge type={employee.employmentType} />
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <dt className="text-neutral-600">Job title</dt>
              <dd>{employee.jobTitle}</dd>
            </div>
            <div>
              <dt className="text-neutral-600">Department</dt>
              <dd>{employee.department}</dd>
            </div>
            <div>
              <dt className="text-neutral-600">Country</dt>
              <dd>{countryName(employee.country)}</dd>
            </div>
            <div>
              <dt className="text-neutral-600">Hired</dt>
              <dd className="num">{formatDate(employee.hireDate)}</dd>
            </div>
            {showSalary && hasSalary(employee) ? (
              <div className="col-span-2 flex items-baseline justify-between border-t border-neutral-100 pt-2">
                <dt className="text-neutral-600">Salary</dt>
                <dd className="num font-semibold text-neutral-900">
                  {formatMoney(employee.salary, employee.currency)}{' '}
                  <span className="text-xs font-normal text-neutral-500">{employee.currency}</span>
                </dd>
              </div>
            ) : null}
          </dl>
          {renderActions ? (
            <div className="grid grid-cols-2 gap-2">{renderActions(employee, 'card')}</div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
