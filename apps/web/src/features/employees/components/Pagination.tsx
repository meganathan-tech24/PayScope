import { Button } from '../../../components/ui/Button';

export function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const format = (value: number) => value.toLocaleString('en');

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3">
      <p role="status" className="text-sm text-neutral-700">
        {total === 0
          ? 'No employees'
          : `Showing ${format(first)}–${format(last)} of ${format(total)}`}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <span className="px-1 text-sm text-neutral-700">
          Page {format(page)} of {format(Math.max(totalPages, 1))}
        </span>
        <Button variant="secondary" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </nav>
  );
}
