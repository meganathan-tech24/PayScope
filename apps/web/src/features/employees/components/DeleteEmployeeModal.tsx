import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { useEmployeeMutations } from '../hooks/useEmployeeMutations';
import { describeEmployeeError } from '../lib/employee-errors';
import type { EmployeeRow } from '../types';

export function DeleteEmployeeModal({
  employee,
  onClose,
  onDeleted,
}: {
  employee: EmployeeRow;
  onClose: () => void;
  onDeleted: (message: string) => void;
}) {
  const { remove, refresh } = useEmployeeMutations();
  const error = remove.isError ? describeEmployeeError(remove.error) : undefined;

  function confirm() {
    remove.mutate(employee.id, {
      onSuccess: () => {
        onDeleted(`Deleted ${employee.fullName}`);
        onClose();
      },
      onError: (failure) => {
        if (describeEmployeeError(failure).gone) void refresh();
      },
    });
  }

  return (
    <Modal title="Delete employee" onClose={onClose}>
      <div className="flex flex-col gap-4">
        {error?.banner ? <Alert tone="error">{error.banner}</Alert> : null}
        <p className="text-neutral-800">
          Delete <strong>{employee.fullName}</strong> ({employee.email})? This removes the record
          and their salary, and cannot be undone.
        </p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={remove.isPending}>
            Cancel
          </Button>
          <Button type="button" variant="danger" loading={remove.isPending} onClick={confirm}>
            {remove.isPending ? 'Deleting…' : 'Delete employee'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
