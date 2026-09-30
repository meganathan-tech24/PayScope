import { RotateCw } from 'lucide-react';
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
      <svg
        viewBox="0 0 64 48"
        className="h-12 w-16 text-neutral-300"
        fill="none"
        aria-hidden="true"
      >
        <rect x="6" y="6" width="52" height="36" rx="5" stroke="currentColor" strokeWidth="2" />
        <path d="M6 16h52" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="27" r="4" className="fill-neutral-300" />
        <path d="M25 25h24M25 31h15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
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
      <Button tone="neutral" look="outline" icon={RotateCw} onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
