import type { ReactNode } from 'react';

export type SwatchKind = 'solid' | 'stripes' | 'median' | 'average' | 'marker';

const SWATCH: Record<SwatchKind, string> = {
  solid: 'bg-chart-4',
  stripes: 'bg-[repeating-linear-gradient(45deg,#2f5c99,#2f5c99_2px,#c7d8f2_2px,#c7d8f2_4px)]',
  median: 'bg-chart-5',
  average: 'bg-[repeating-linear-gradient(45deg,#5b86c4,#5b86c4_2px,#d3e0f4_2px,#d3e0f4_4px)]',
  marker: 'bg-chart-5 !w-0.5',
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
