import type { ReactNode } from 'react';

import { Button } from './Button';

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
      <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
      {children ? <p className="max-w-prose text-neutral-600">{children}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({
  title,
  onRetry,
  children,
}: {
  title: string;
  onRetry: () => void;
  children?: ReactNode;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-lg border border-danger/30 bg-danger-light px-6 py-10 text-center"
    >
      <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
      {children ? <p className="max-w-prose text-neutral-700">{children}</p> : null}
      <Button variant="secondary" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
