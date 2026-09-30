import type { EmployeeFull } from '@payscope/types';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { PageHeader } from '../components/layout/PageHeader';
import { Alert } from '../components/ui/Alert';
import { Button, IconButton } from '../components/ui/Button';
import { EmptyState, ErrorState } from '../components/ui/StateMessages';
import { useAuth } from '../features/auth/hooks/useAuth';
import { DeleteEmployeeModal } from '../features/employees/components/DeleteEmployeeModal';
import { EmployeeCards } from '../features/employees/components/EmployeeCards';
import { EmployeeFilters } from '../features/employees/components/EmployeeFilters';
import { EmployeeFormModal } from '../features/employees/components/EmployeeFormModal';
import { EmployeeListSkeleton } from '../features/employees/components/EmployeeListSkeleton';
import { EmployeeTable } from '../features/employees/components/EmployeeTable';
import { ExportButton } from '../features/employees/components/ExportButton';
import { Pagination } from '../features/employees/components/Pagination';
import { SortControls } from '../features/employees/components/SortControls';
import { useEmployeeList } from '../features/employees/hooks/useEmployeeList';
import { useEmployeeParams } from '../features/employees/hooks/useEmployeeParams';
import { sortFieldsFor } from '../features/employees/lib/search-params';
import { hasSalary, PAGE_SIZE, type EmployeeRow } from '../features/employees/types';

const SEARCH_DEBOUNCE_MS = 300;

type Dialog =
  | { kind: 'form'; employee: EmployeeFull | null }
  | { kind: 'delete'; employee: EmployeeRow }
  | null;

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

  const [dialog, setDialog] = useState<Dialog>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Deleting the last row of the last page (or a hand-edited URL) can leave the page number
  // past the end: step back to the last page instead of showing an empty list.
  const totalPages = list.data?.meta.totalPages;
  useEffect(() => {
    if (totalPages && params.page > totalPages) update({ page: totalPages }, { replace: true });
  }, [totalPages, params.page, update]);

  if (!user) return null;
  const isHr = user.role === 'HR_MANAGER';
  const employees = list.data?.data ?? [];
  const meta = list.data?.meta;

  // Edit is always soft blue with a pencil, delete soft red with a bin. Rows use compact icon
  // buttons named for the person; cards have room for the word as well.
  const renderActions = (employee: EmployeeRow, layout: 'row' | 'card') => {
    const edit = () => hasSalary(employee) && setDialog({ kind: 'form', employee });
    const remove = () => setDialog({ kind: 'delete', employee });
    return layout === 'row' ? (
      <>
        <IconButton
          label={`Edit ${employee.fullName}`}
          icon={Pencil}
          tone="edit"
          look="soft"
          onClick={edit}
        />
        <IconButton
          label={`Delete ${employee.fullName}`}
          icon={Trash2}
          tone="danger"
          look="soft"
          onClick={remove}
        />
      </>
    ) : (
      <>
        <Button
          tone="edit"
          look="soft"
          icon={Pencil}
          aria-label={`Edit ${employee.fullName}`}
          onClick={edit}
        >
          Edit
        </Button>
        <Button
          tone="danger"
          look="soft"
          icon={Trash2}
          aria-label={`Delete ${employee.fullName}`}
          onClick={remove}
        >
          Delete
        </Button>
      </>
    );
  };

  function sortBy(field: string) {
    update({
      sortBy: field,
      sortDir: params.sortBy === field && params.sortDir === 'asc' ? 'desc' : 'asc',
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Employees"
        description={
          isHr
            ? 'Search, filter and manage employees and their pay.'
            : 'Browse the employee directory. Individual salaries are not shown to your account.'
        }
        actions={
          <>
            {isHr ? (
              <Button icon={Plus} onClick={() => setDialog({ kind: 'form', employee: null })}>
                Add employee
              </Button>
            ) : null}
            <ExportButton params={params} />
          </>
        }
      />

      {notice ? (
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <Alert tone="success">{notice}</Alert>
          </div>
          <Button tone="neutral" look="ghost" onClick={() => setNotice(null)}>
            Dismiss
          </Button>
        </div>
      ) : null}

      <EmployeeFilters
        params={params}
        onChange={update}
        onClear={clearFilters}
        hasFilters={hasFilters}
      >
        <SortControls fields={sortFieldsFor(user.role)} params={params} onChange={update} />
      </EmployeeFilters>

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
              <Button tone="neutral" look="outline" onClick={clearFilters}>
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
        <div className="flex flex-col gap-3 md:gap-0">
          <EmployeeTable
            employees={employees}
            params={params}
            showSalary={isHr}
            onSort={sortBy}
            renderActions={isHr ? renderActions : undefined}
            busy={list.isPlaceholderData}
          />
          <EmployeeCards
            employees={employees}
            showSalary={isHr}
            renderActions={isHr ? renderActions : undefined}
            busy={list.isPlaceholderData}
          />
          {meta ? (
            <Pagination
              page={meta.page ?? params.page}
              pageSize={meta.pageSize ?? PAGE_SIZE}
              total={meta.total ?? 0}
              totalPages={meta.totalPages ?? 1}
              onPage={(page) => update({ page })}
            />
          ) : null}
        </div>
      )}

      {dialog?.kind === 'form' ? (
        <EmployeeFormModal
          employee={dialog.employee}
          onClose={() => setDialog(null)}
          onSaved={setNotice}
        />
      ) : null}
      {dialog?.kind === 'delete' ? (
        <DeleteEmployeeModal
          employee={dialog.employee}
          onClose={() => setDialog(null)}
          onDeleted={setNotice}
        />
      ) : null}
    </div>
  );
}
