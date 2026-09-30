import { useMutation } from '@tanstack/react-query';

import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { employeesService } from '../services/employees.service';
import type { EmployeeListParams } from '../types';

// The endpoint needs the bearer token, so it is fetched and saved rather than linked.
// The server decides the columns: a VIEWER's file has no salary column.
export function ExportButton({ params }: { params: EmployeeListParams }) {
  const exportCsv = useMutation({
    mutationFn: () => employeesService.exportCsv(params),
    onSuccess: ({ blob, filename }) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
  });

  return (
    <div className="flex flex-col items-end gap-2">
      <Button variant="secondary" loading={exportCsv.isPending} onClick={() => exportCsv.mutate()}>
        {exportCsv.isPending ? 'Preparing…' : 'Export CSV'}
      </Button>
      {exportCsv.isError ? <Alert tone="error">The export failed. Please try again.</Alert> : null}
    </div>
  );
}
