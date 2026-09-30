import { Button } from '../../../components/ui/Button';

// Compact loading, empty and error views for one dashboard section, so a section that
// fails or has nothing to show never takes the rest of the page with it.
export function SectionSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-3">
      <span className="sr-only">{label}</span>
      <div className="skeleton h-4 w-1/3" />
      <div className="skeleton h-40 w-full" />
    </div>
  );
}

export function SectionEmpty({ children }: { children: string }) {
  return (
    <p className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-center text-neutral-700">
      {children}
    </p>
  );
}

export function SectionError({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-md border border-danger/30 bg-danger-light px-4 py-4"
    >
      <p className="text-neutral-900">We could not load {what}.</p>
      <Button variant="secondary" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
