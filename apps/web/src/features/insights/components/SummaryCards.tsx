import type { InsightStatsRow, InsightStatsRowBasic } from '@payscope/types';

import { formatMoney } from '../../../lib/money';
import { countryName } from '../../employees/lib/format';

type Row = InsightStatsRow | InsightStatsRowBasic;

function Card({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="card flex flex-col gap-1 p-5">
      <dt className="text-sm text-neutral-600">{label}</dt>
      <dd className="display text-2xl font-semibold tabular-nums text-neutral-900">{value}</dd>
      {detail ? <p className="text-sm text-neutral-600">{detail}</p> : null}
    </div>
  );
}

interface Props {
  /** Total employees and countries: counts, so they may span currencies. */
  employees: number;
  countries: number;
  /** Country rows in the one selected currency (or all USD). Their medians are comparable. */
  rows: Row[];
  /** HR managers only. */
  outliers?: number;
}

export function SummaryCards({ employees, countries, rows, outliers }: Props) {
  // Only rows of a single currency reach here, so ranking their medians is fair.
  const ranked = [...rows].sort((a, b) => b.median - a.median);
  const highest = ranked[0];
  const lowest = ranked.length > 1 ? ranked[ranked.length - 1] : undefined;

  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card
        label="Employees"
        value={employees.toLocaleString('en')}
        detail={`across ${countries} ${countries === 1 ? 'country' : 'countries'}`}
      />
      {highest ? (
        <Card
          label={lowest ? 'Highest median pay' : 'Median pay'}
          value={formatMoney(highest.median, highest.currency)}
          detail={countryName(highest.key)}
        />
      ) : null}
      {lowest ? (
        <Card
          label="Lowest median pay"
          value={formatMoney(lowest.median, lowest.currency)}
          detail={countryName(lowest.key)}
        />
      ) : null}
      {outliers !== undefined ? (
        <Card
          label="Outliers flagged"
          value={outliers.toLocaleString('en')}
          detail="compared with like-for-like peers"
        />
      ) : null}
    </dl>
  );
}
