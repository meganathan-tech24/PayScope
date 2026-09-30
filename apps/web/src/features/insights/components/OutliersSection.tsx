import type { OutlierRow } from '@payscope/types';
import { useId } from 'react';

import { formatMoney } from '../../../lib/money';
import { countryName, employmentTypeLabel } from '../../employees/lib/format';
import { useOutliers } from '../hooks/useInsights';

import { SectionEmpty, SectionError, SectionSkeleton } from './SectionStates';

// Direction is shown by an arrow, a sign and a word, not by colour alone.
function Deviation({ pct }: { pct: number }) {
  const above = pct > 0;
  return (
    <span className="whitespace-nowrap font-medium tabular-nums">
      <span aria-hidden="true">{above ? '▲' : '▼'} </span>
      {above ? '+' : '−'}
      {Math.abs(pct).toLocaleString('en')}%
      <span className="sr-only"> {above ? 'above' : 'below'} the group median</span>
    </span>
  );
}

function OutlierCards({ rows }: { rows: OutlierRow[] }) {
  return (
    <ul aria-label="Outliers" className="flex flex-col gap-3 md:hidden">
      {rows.map((row) => (
        <li key={row.id} className="rounded-lg border border-neutral-200 p-4">
          <p className="font-semibold text-neutral-900">{row.fullName}</p>
          <p className="text-sm text-neutral-600">
            {row.jobTitle} · {countryName(row.country)} · {employmentTypeLabel(row.employmentType)}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <dt className="text-neutral-600">Salary</dt>
              <dd className="font-medium tabular-nums">{formatMoney(row.salary, row.currency)}</dd>
            </div>
            <div>
              <dt className="text-neutral-600">Group median</dt>
              <dd className="tabular-nums">{formatMoney(row.groupMedian, row.currency)}</dd>
            </div>
            <div>
              <dt className="text-neutral-600">Difference</dt>
              <dd>
                <Deviation pct={row.deviationPct} />
              </dd>
            </div>
            <div>
              <dt className="text-neutral-600">Peers in group</dt>
              <dd className="tabular-nums">{row.groupSize}</dd>
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
        <h2 id={headingId} className="text-lg font-semibold text-neutral-900">
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
          <div className="relative hidden overflow-x-auto rounded-lg border border-neutral-200 md:block">
            <table className="table" aria-label="Outliers">
              <thead className="bg-neutral-50 text-neutral-700">
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
              <tbody className="divide-y divide-neutral-200">
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
                    <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums">
                      {formatMoney(row.salary, row.currency)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums">
                      {formatMoney(row.groupMedian, row.currency)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Deviation pct={row.deviationPct} />
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{row.groupSize}</td>
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
