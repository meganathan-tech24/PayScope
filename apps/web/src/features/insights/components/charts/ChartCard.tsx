import { useId, type ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  description?: string;
  /** Plain-language reading of the chart; it is the chart's accessible name and is shown. */
  summary?: string;
  /** Controls (a selector) for this section. */
  controls?: ReactNode;
  /** Notes about the data: approximate values, hidden groups. */
  notes?: ReactNode;
  /** The chart itself. */
  chart?: ReactNode;
  /** The data as a real table, for the disclosure under the chart. */
  table?: ReactNode;
  /** Replaces the chart and table: a skeleton, an empty state or an error. */
  state?: ReactNode;
}

export function ChartCard({
  title,
  description,
  summary,
  controls,
  notes,
  chart,
  table,
  state,
}: ChartCardProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="card flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id={headingId} className="text-lg font-semibold text-neutral-900">
            {title}
          </h2>
          {description ? (
            <p className="max-w-prose text-sm text-neutral-600">{description}</p>
          ) : null}
        </div>
        {controls}
      </div>
      {notes}
      {state ?? (
        <>
          <figure className="flex flex-col gap-3">
            {/* The image role covers the drawing only; the table below stays readable text. */}
            <div role="img" aria-label={summary ?? title} className="min-w-0">
              {chart}
            </div>
            {summary ? (
              <figcaption className="text-sm text-neutral-700">{summary}</figcaption>
            ) : null}
          </figure>
          {table}
        </>
      )}
    </section>
  );
}
