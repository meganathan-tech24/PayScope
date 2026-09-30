import { useEffect, useState } from 'react';

import { Button } from '../components/ui/Button';
import { EmptyState, ErrorState } from '../components/ui/StateMessages';
import { useAuth } from '../features/auth/hooks/useAuth';
import { EmployeeCards } from '../features/employees/components/EmployeeCards';
import { EmployeeFilters } from '../features/employees/components/EmployeeFilters';
import { EmployeeListSkeleton } from '../features/employees/components/EmployeeListSkeleton';
import { EmployeeTable } from '../features/employees/components/EmployeeTable';
import { ExportButton } from '../features/employees/components/ExportButton';
import { Pagination } from '../features/employees/components/Pagination';
import { SortControls } from '../features/employees/components/SortControls';
import { useEmployeeList } from '../features/employees/hooks/useEmployeeList';
import { useEmployeeParams } from '../features/employees/hooks/useEmployeeParams';
import { sortFieldsFor } from '../features/employees/lib/search-params';
import { PAGE_SIZE } from '../features/employees/types';

const SEARCH_DEBOUNCE_MS = 300;

export function EmployeesPage() {
  const { user } = useAuth();
  const { params, update, clearFilters, hasFilters } = useEmployeeParams();

  // The URL follows every keystroke, but the request waits until typing pauses.
  const [requestSearch, setRequestSearch] = useState(params.search);
  useEffect(() => {
    const timer = setTimeout(() => setRequestSearch(params.search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [params.search]);
  const list = useEmployeeList({ ...params, search: requestSearch });

  if (!user) return null;
  const isHr = user.role === 'HR_MANAGER';
  const employees = list.data?.data ?? [];
  const meta = list.data?.meta;

  function sortBy(field: string) {
    update({
      sortBy: field,
      sortDir: params.sortBy === field && params.sortDir === 'asc' ? 'desc' : 'asc',
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="display text-3xl font-semibold">Employees</h1>
          <p className="max-w-prose text-neutral-600">
            {isHr
              ? 'Search, filter and manage employees and their pay.'
              : 'Browse the employee directory. Individual salaries are not shown to your account.'}
          </p>
        </div>
        <ExportButton params={params} />
      </div>

      <EmployeeFilters
        params={params}
        onChange={update}
        onClear={clearFilters}
        hasFilters={hasFilters}
      />
      <SortControls fields={sortFieldsFor(user.role)} params={params} onChange={update} />

      {list.isPending ? (
        <EmployeeListSkeleton />
      ) : list.isError && !list.data ? (
        <ErrorState title="We could not load employees" onRetry={() => void list.refetch()}>
          Check your connection and try again.
        </ErrorState>
      ) : employees.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'No employees match these filters' : 'No employees yet'}
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        >
          {hasFilters
            ? 'Try a different search or remove a filter.'
            : 'Employees will appear here.'}
        </EmptyState>
      ) : (
        <>
          <EmployeeTable
            employees={employees}
            params={params}
            showSalary={isHr}
            onSort={sortBy}
            busy={list.isPlaceholderData}
          />
          <EmployeeCards employees={employees} showSalary={isHr} busy={list.isPlaceholderData} />
          {meta ? (
            <Pagination
              page={meta.page ?? params.page}
              pageSize={meta.pageSize ?? PAGE_SIZE}
              total={meta.total ?? 0}
              totalPages={meta.totalPages ?? 1}
              onPage={(page) => update({ page })}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
