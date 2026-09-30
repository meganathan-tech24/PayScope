import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 md:rounded-t-none md:border-t-0"
    >
      <p role="status" className="num text-sm text-neutral-700">
        {total === 0
          ? 'No employees'
          : `Showing ${format(first)}–${format(last)} of ${format(total)}`}
      </p>
      <div className="flex items-center gap-2">
        <Button
          tone="neutral"
          look="outline"
          size="sm"
          icon={ChevronLeft}
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </Button>
        <span className="num px-1 text-sm text-neutral-700">
          Page {format(page)} of {format(Math.max(totalPages, 1))}
        </span>
        <Button
          tone="neutral"
          look="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
