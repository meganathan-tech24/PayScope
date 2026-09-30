import type { ReactNode } from 'react';

// One tooltip look for every chart. It is a convenience for mouse users: the same numbers
// are in the text summary and the data table.
export function ChartTooltip({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm shadow-overlay">
      <p className="mb-1 font-semibold text-neutral-900">{title}</p>
      <div className="num flex flex-col gap-0.5 text-neutral-700">{children}</div>
    </div>
  );
}

export function TooltipRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex items-baseline justify-between gap-6">
      <span>{label}</span>
      <span className="font-medium text-neutral-900">{value}</span>
    </p>
  );
}
