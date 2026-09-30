import type { InsightStatsRow, InsightStatsRowBasic } from '@payscope/types';
import { AlertTriangle, TrendingDown, TrendingUp, Users, type LucideIcon } from 'lucide-react';

import { formatMoney } from '../../../lib/money';
import { countryName } from '../../employees/lib/format';

type Row = InsightStatsRow | InsightStatsRowBasic;

type Tone = 'brand' | 'warning';

const TONE: Record<Tone, string> = {
  brand: 'bg-brand-100 text-brand-700',
  warning: 'bg-warning-light text-warning',
};

function Card({
  icon: Icon,
  tone = 'brand',
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  tone?: Tone;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="card flex items-start gap-4 p-5">
      <span
        aria-hidden="true"
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TONE[tone]}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <dt className="text-sm font-medium text-neutral-600">{label}</dt>
        <dd className="num break-words text-2xl font-semibold tracking-tight text-neutral-900">
          {value}
        </dd>
        {detail ? <p className="text-sm text-neutral-600">{detail}</p> : null}
      </div>
    </div>
  );
}

// Full class names, and as many columns as there are cards, so a Viewer's two cards are not squeezed.
const COLUMNS: Record<number, string> = {
  2: 'xl:max-w-2xl',
  3: 'xl:grid-cols-3',
  4: 'xl:grid-cols-4',
};

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

  const count = 1 + (highest ? 1 : 0) + (lowest ? 1 : 0) + (outliers !== undefined ? 1 : 0);

  return (
    <dl className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${COLUMNS[count] ?? COLUMNS[4]}`}>
      <Card
        icon={Users}
        label="Employees"
        value={employees.toLocaleString('en')}
        detail={`across ${countries} ${countries === 1 ? 'country' : 'countries'}`}
      />
      {highest ? (
        <Card
          icon={TrendingUp}
          label={lowest ? 'Highest median pay' : 'Median pay'}
          value={formatMoney(highest.median, highest.currency)}
          detail={countryName(highest.key)}
        />
      ) : null}
      {lowest ? (
        <Card
          icon={TrendingDown}
          label="Lowest median pay"
          value={formatMoney(lowest.median, lowest.currency)}
          detail={countryName(lowest.key)}
        />
      ) : null}
      {outliers !== undefined ? (
        <Card
          icon={AlertTriangle}
          tone="warning"
          label="Outliers flagged"
          value={outliers.toLocaleString('en')}
          detail="compared with like-for-like peers"
        />
      ) : null}
    </dl>
  );
}
