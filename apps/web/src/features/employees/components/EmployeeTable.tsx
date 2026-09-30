import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';

import { formatMoney } from '../../../lib/money';
import { countryName, formatDate, sortLabel } from '../lib/format';
import { hasSalary, type EmployeeListParams, type EmployeeRow } from '../types';

import { Avatar } from './Avatar';
import { EmploymentTypeBadge } from './EmploymentTypeBadge';

interface EmployeeTableProps {
  employees: EmployeeRow[];
  params: EmployeeListParams;
  showSalary: boolean;
  onSort: (field: string) => void;
  renderActions?: (employee: EmployeeRow, layout: 'row' | 'card') => React.ReactNode;
  busy: boolean;
}

function SortHeader({
  field,
  params,
  onSort,
  className,
}: {
  field: string;
  params: EmployeeListParams;
  onSort: (field: string) => void;
  className?: string;
}) {
  const active = params.sortBy === field;
  const ariaSort = active ? (params.sortDir === 'asc' ? 'ascending' : 'descending') : 'none';
  const Arrow = active ? (params.sortDir === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown;

  return (
    <th scope="col" aria-sort={ariaSort} className={className}>
      <button
        type="button"
        className={[
          '-mx-2 inline-flex min-h-9 items-center gap-1 rounded px-2 uppercase tracking-wide hover:bg-neutral-200',
          active ? 'text-neutral-900' : '',
        ].join(' ')}
        onClick={() => onSort(field)}
      >
        {sortLabel(field)}
        <Arrow
          aria-hidden="true"
          className={['h-3.5 w-3.5', active ? 'text-brand-600' : 'text-neutral-400'].join(' ')}
        />
      </button>
    </th>
  );
}

// From the md breakpoint up. Below it the same rows render as cards (EmployeeCards). The
// table scrolls inside its own frame, so the header stays in view and the page never
// scrolls sideways.
export function EmployeeTable({
  employees,
  params,
  showSalary,
  onSort,
  renderActions,
  busy,
}: EmployeeTableProps) {
  return (
    <div
      className="relative hidden max-h-[calc(100vh-15rem)] min-h-64 overflow-auto rounded-lg border border-neutral-200 bg-white md:block md:rounded-b-none"
      aria-busy={busy}
    >
      <table className="table" aria-label="Employees">
        <thead>
          <tr>
            <SortHeader field="fullName" params={params} onSort={onSort} />
            <SortHeader field="jobTitle" params={params} onSort={onSort} />
            <SortHeader field="department" params={params} onSort={onSort} />
            <SortHeader field="country" params={params} onSort={onSort} />
            <th scope="col">Type</th>
            <SortHeader field="hireDate" params={params} onSort={onSort} />
            {showSalary ? (
              <SortHeader field="salary" params={params} onSort={onSort} className="text-right" />
            ) : null}
            {renderActions ? (
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody className={busy ? 'opacity-60' : ''}>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td>
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar name={employee.fullName} />
                  <div className="min-w-0 max-w-[10rem] 2xl:max-w-[13rem]">
                    <div
                      className="truncate font-medium text-neutral-900"
                      title={employee.fullName}
                    >
                      {employee.fullName}
                    </div>
                    <div className="truncate text-xs text-neutral-600" title={employee.email}>
                      {employee.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="min-w-[6.5rem]">{employee.jobTitle}</td>
              <td className="whitespace-nowrap">{employee.department}</td>
              <td className="whitespace-nowrap">{countryName(employee.country)}</td>
              <td>
                <EmploymentTypeBadge type={employee.employmentType} />
              </td>
              <td className="num whitespace-nowrap text-neutral-700">
                {formatDate(employee.hireDate)}
              </td>
              {showSalary ? (
                <td className="whitespace-nowrap text-right">
                  {hasSalary(employee) ? (
                    <>
                      <span className="num font-medium text-neutral-900">
                        {formatMoney(employee.salary, employee.currency)}
                      </span>{' '}
                      <span className="text-xs text-neutral-500">{employee.currency}</span>
                    </>
                  ) : null}
                </td>
              ) : null}
              {renderActions ? (
                <td className="whitespace-nowrap text-right">
                  <div className="inline-flex gap-1.5">{renderActions(employee, 'row')}</div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
