import type { ReactNode } from 'react';

export type SwatchKind = 'solid' | 'stripes' | 'dark' | 'highlight';

const SWATCH: Record<SwatchKind, string> = {
  solid: 'bg-brand-600',
  stripes: 'bg-[repeating-linear-gradient(45deg,#2563eb,#2563eb_2px,#bfdbfe_2px,#bfdbfe_4px)]',
  dark: 'bg-ink',
  highlight: 'bg-signal',
};

// The legend names each series in words and gives it a pattern, so it does not depend on
// telling two blues apart.
export function ChartLegend({ items }: { items: { kind: SwatchKind; label: ReactNode }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-700">
      {items.map((item, index) => (
        <li key={index} className="flex items-center gap-2">
          <span aria-hidden="true" className={`h-3 w-5 shrink-0 rounded-sm ${SWATCH[item.kind]}`} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
