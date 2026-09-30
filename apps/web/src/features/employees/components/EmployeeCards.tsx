import type { ReactNode } from 'react';

import { formatMoney } from '../../../lib/money';
import { countryName, employmentTypeLabel, formatDate } from '../lib/format';
import { hasSalary, type EmployeeRow } from '../types';

// Below the md breakpoint: one card per employee instead of a table that would scroll sideways.
export function EmployeeCards({
  employees,
  showSalary,
  renderActions,
  busy,
}: {
  employees: EmployeeRow[];
  showSalary: boolean;
  renderActions?: (employee: EmployeeRow) => ReactNode;
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
          <div>
            <p className="font-semibold text-neutral-900">{employee.fullName}</p>
            <p className="break-all text-sm text-neutral-600">{employee.email}</p>
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
              <dt className="text-neutral-600">Type</dt>
              <dd>{employmentTypeLabel(employee.employmentType)}</dd>
            </div>
            <div>
              <dt className="text-neutral-600">Hired</dt>
              <dd>{formatDate(employee.hireDate)}</dd>
            </div>
            {showSalary && hasSalary(employee) ? (
              <div>
                <dt className="text-neutral-600">Salary</dt>
                <dd className="font-medium tabular-nums">
                  {formatMoney(employee.salary, employee.currency)}
                </dd>
              </div>
            ) : null}
          </dl>
          {renderActions ? <div className="flex gap-2">{renderActions(employee)}</div> : null}
        </li>
      ))}
    </ul>
  );
}
