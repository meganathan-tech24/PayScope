import type { ReactNode } from 'react';

// The text alternative to a chart: the same numbers as a real table, one click away and
// operable with the keyboard. The table scrolls inside its own box on narrow screens.
export function DataTableDisclosure({
  label = 'View data as a table',
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-md border border-neutral-200 bg-white">
      <summary className="flex min-h-11 cursor-pointer items-center px-4 text-sm font-medium text-brand-700 marker:text-brand-700">
        {label}
      </summary>
      <div className="relative overflow-x-auto border-t border-neutral-200">{children}</div>
    </details>
  );
}
