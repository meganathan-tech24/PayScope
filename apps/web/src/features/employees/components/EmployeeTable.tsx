import { formatMoney } from '../../../lib/money';
import { countryName, employmentTypeLabel, formatDate, sortLabel } from '../lib/format';
import { hasSalary, type EmployeeListParams, type EmployeeRow } from '../types';

interface EmployeeTableProps {
  employees: EmployeeRow[];
  params: EmployeeListParams;
  showSalary: boolean;
  onSort: (field: string) => void;
  renderActions?: (employee: EmployeeRow) => React.ReactNode;
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

  return (
    <th scope="col" aria-sort={ariaSort} className={className}>
      <button
        type="button"
        className="-mx-2 inline-flex min-h-11 items-center gap-1 rounded px-2 font-semibold hover:bg-neutral-100"
        onClick={() => onSort(field)}
      >
        {sortLabel(field)}
        <span aria-hidden="true" className={active ? 'text-brand-700' : 'text-neutral-400'}>
          {active ? (params.sortDir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </button>
    </th>
  );
}

// From the md breakpoint up. Below it the same rows render as cards (EmployeeCards).
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
      className="hidden overflow-x-auto rounded-lg border border-neutral-200 bg-white md:block"
      aria-busy={busy}
    >
      <table className="table" aria-label="Employees">
        <thead className="bg-neutral-50 text-neutral-700">
          <tr>
            <SortHeader field="fullName" params={params} onSort={onSort} className="px-4" />
            <SortHeader field="jobTitle" params={params} onSort={onSort} className="px-4" />
            <SortHeader field="department" params={params} onSort={onSort} className="px-4" />
            <SortHeader field="country" params={params} onSort={onSort} className="px-4" />
            <th scope="col" className="px-4 font-semibold">
              Type
            </th>
            <SortHeader field="hireDate" params={params} onSort={onSort} className="px-4" />
            {showSalary ? (
              <SortHeader
                field="salary"
                params={params}
                onSort={onSort}
                className="px-4 text-right"
              />
            ) : null}
            {renderActions ? (
              <th scope="col" className="px-4 font-semibold">
                <span className="sr-only">Actions</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody className={['divide-y divide-neutral-200', busy ? 'opacity-60' : ''].join(' ')}>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td className="px-4 py-3">
                <div className="font-medium text-neutral-900">{employee.fullName}</div>
                <div className="break-all text-xs text-neutral-600">{employee.email}</div>
              </td>
              <td className="px-4 py-3">{employee.jobTitle}</td>
              <td className="px-4 py-3">{employee.department}</td>
              <td className="px-4 py-3">{countryName(employee.country)}</td>
              <td className="px-4 py-3">{employmentTypeLabel(employee.employmentType)}</td>
              <td className="whitespace-nowrap px-4 py-3">{formatDate(employee.hireDate)}</td>
              {showSalary ? (
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                  {hasSalary(employee) ? formatMoney(employee.salary, employee.currency) : null}
                </td>
              ) : null}
              {renderActions ? (
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  {renderActions(employee)}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
