import { BarChart3, RotateCw, TriangleAlert } from 'lucide-react';

import { Button } from '../../../components/ui/Button';

// Compact loading, empty and error views for one dashboard section, so a section that
// fails or has nothing to show never takes the rest of the page with it.
export function SectionSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-3">
      <span className="sr-only">{label}</span>
      <div className="skeleton h-4 w-1/3" />
      <div className="skeleton h-40 w-full rounded-lg" />
    </div>
  );
}

export function SectionEmpty({ children }: { children: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-center text-neutral-700">
      <BarChart3 className="h-6 w-6 text-neutral-400" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

export function SectionError({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-lg border border-danger/30 bg-danger-light px-4 py-4"
    >
      <p className="flex items-center gap-2 text-neutral-900">
        <TriangleAlert className="h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
        We could not load {what}.
      </p>
      <Button tone="neutral" look="outline" icon={RotateCw} onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
