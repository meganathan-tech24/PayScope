import type { OutlierRow } from '@payscope/types';
import { AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';
import { useId } from 'react';

import { formatMoney } from '../../../lib/money';
import { countryName, employmentTypeLabel } from '../../employees/lib/format';
import { useOutliers } from '../hooks/useInsights';

import { SectionEmpty, SectionError, SectionSkeleton } from './SectionStates';

// Half-widths for the distance bar, in tenths of the largest distance shown (100%). Written
// out so Tailwind can see the classes; there are no inline styles.
const BAR_WIDTH = [
  'w-[5%]',
  'w-[10%]',
  'w-[15%]',
  'w-[20%]',
  'w-[25%]',
  'w-[30%]',
  'w-[35%]',
  'w-[40%]',
  'w-[45%]',
  'w-1/2',
] as const;

// Direction is shown by an arrow, a sign and a word, not by colour alone. The bar grows to
// the right of the centre line for pay above the group median and to the left for below,
// up to 100% away from the median.
function Deviation({ pct }: { pct: number }) {
  const above = pct > 0;
  const Arrow = above ? ArrowUp : ArrowDown;
  const step = Math.min(10, Math.max(1, Math.ceil(Math.min(Math.abs(pct), 100) / 10)));
  return (
    <span className="inline-flex flex-col items-end gap-1.5">
      <span className="num inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-warning-light px-2 py-0.5 text-xs font-semibold text-warning">
        <Arrow className="h-3 w-3" aria-hidden="true" />
        {above ? '+' : '−'}
        {Math.abs(pct).toLocaleString('en')}%
        <span className="sr-only"> {above ? 'above' : 'below'} the group median</span>
      </span>
      <span
        aria-hidden="true"
        className="relative block h-1.5 w-24 overflow-hidden rounded-full bg-neutral-200"
      >
        <span className="absolute inset-y-0 left-1/2 w-px bg-neutral-500" />
        <span
          className={`absolute inset-y-0 bg-warning-mark ${BAR_WIDTH[step - 1]} ${above ? 'left-1/2' : 'right-1/2'}`}
        />
      </span>
    </span>
  );
}

function OutlierCards({ rows }: { rows: OutlierRow[] }) {
  return (
    <ul aria-label="Outliers" className="flex flex-col gap-3 md:hidden">
      {rows.map((row) => (
        <li key={row.id} className="rounded-lg border border-neutral-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold text-neutral-900">{row.fullName}</p>
            <Deviation pct={row.deviationPct} />
          </div>
          <p className="text-sm text-neutral-600">
            {row.jobTitle} · {countryName(row.country)} · {employmentTypeLabel(row.employmentType)}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <dt className="text-neutral-600">Salary</dt>
              <dd className="num font-medium">{formatMoney(row.salary, row.currency)}</dd>
            </div>
            <div>
              <dt className="text-neutral-600">Group median</dt>
              <dd className="num">{formatMoney(row.groupMedian, row.currency)}</dd>
            </div>
            <div>
              <dt className="text-neutral-600">Peers in group</dt>
              <dd className="num">{row.groupSize}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}

// HR managers only: this lists individual people with their salaries. The dashboard never
// renders it for anyone else, and never asks the API for it either.
export function OutliersSection({ usd, currency }: { usd: boolean; currency: string }) {
  const headingId = useId();
  const query = useOutliers(true, usd ? undefined : currency || undefined);
  const outliers = query.data;
  const rows = outliers?.rows ?? [];

  return (
    <section aria-labelledby={headingId} className="card flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2
          id={headingId}
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-neutral-900"
        >
          <AlertTriangle className="h-5 w-5 text-warning-mark" aria-hidden="true" />
          Outliers
        </h2>
        <p className="max-w-prose text-sm text-neutral-600">
          Employees paid far outside the range of their peers: the same country, currency, job title
          and employment type (groups need at least 8 people). Each salary is in the person&apos;s
          own currency.
          {usd
            ? ' This list is not converted, so it covers every currency.'
            : ` Showing people paid in ${currency}.`}
        </p>
      </div>

      {query.isPending ? (
        <SectionSkeleton label="Loading outliers" />
      ) : query.isError && !outliers ? (
        <SectionError what="outliers" onRetry={() => void query.refetch()} />
      ) : rows.length === 0 ? (
        <SectionEmpty>No outliers found for this selection.</SectionEmpty>
      ) : (
        <>
          <p role="status" className="text-sm text-neutral-700">
            Showing {rows.length} of {outliers?.total.toLocaleString('en')}, largest difference
            first.
          </p>
          <div className="relative hidden max-h-[32rem] overflow-auto rounded-lg border border-neutral-200 md:block">
            <table className="table" aria-label="Outliers">
              <thead>
                <tr>
                  <th scope="col" className="px-4 py-2 font-semibold">
                    Employee
                  </th>
                  <th scope="col" className="px-4 py-2 font-semibold">
                    Job title
                  </th>
                  <th scope="col" className="px-4 py-2 font-semibold">
                    Country
                  </th>
                  <th scope="col" className="px-4 py-2 font-semibold">
                    Employment type
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-semibold">
                    Salary
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-semibold">
                    Group median
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-semibold">
                    Difference
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-semibold">
                    Peers in group
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <th scope="row" className="px-4 py-2 font-medium">
                      {row.fullName}
                    </th>
                    <td className="px-4 py-2">{row.jobTitle}</td>
                    <td className="px-4 py-2">{countryName(row.country)}</td>
                    <td className="whitespace-nowrap px-4 py-2">
                      {employmentTypeLabel(row.employmentType)}
                    </td>
                    <td className="num whitespace-nowrap px-4 py-2 text-right">
                      {formatMoney(row.salary, row.currency)}
                    </td>
                    <td className="num whitespace-nowrap px-4 py-2 text-right">
                      {formatMoney(row.groupMedian, row.currency)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Deviation pct={row.deviationPct} />
                    </td>
                    <td className="num px-4 py-2 text-right">{row.groupSize}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <OutlierCards rows={rows} />
        </>
      )}
    </section>
  );
}
