import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { formatMoney } from '../../../lib/money';
import { usePayByGroup } from '../hooks/useInsights';
import { DIMENSION_LABEL, groupLabel } from '../lib/labels';
import type { PayGroup } from '../services/insights.service';

import { ChartCard } from './charts/ChartCard';
import { ChartLegend } from './charts/ChartLegend';
import { DataTableDisclosure } from './charts/DataTableDisclosure';
import { PayRangeChart } from './charts/PayRangeChart';
import { HiddenGroupsNote } from './InsightNotes';
import { SectionEmpty, SectionError, SectionSkeleton } from './SectionStates';

const CHART_ROWS = 15;
const OPTIONS = (['country', 'jobTitle', 'department'] as const).map((value) => ({
  value,
  label: DIMENSION_LABEL[value],
}));

interface Props {
  payBy: PayGroup;
  onPayBy: (group: PayGroup) => void;
  usd: boolean;
  currency: string;
}

export function PayByGroupSection({ payBy, onPayBy, usd, currency }: Props) {
  const query = usePayByGroup(payBy, usd, currency);
  const stats = query.data;
  const rows = [...(stats?.rows ?? [])].sort((a, b) => b.median - a.median);
  // HR rows carry min and max, a VIEWER's do not: the table simply has no such columns.
  const hasExtremes = rows.length > 0 && rows.every((row) => 'min' in row && 'max' in row);
  const shown = rows.slice(0, CHART_ROWS);
  const money = (amount: number, code: string) => formatMoney(amount, code);

  const highest = rows[0];
  const lowest = rows.length > 1 ? rows[rows.length - 1] : undefined;
  const summary = highest
    ? `Pay by ${DIMENSION_LABEL[payBy].toLowerCase()} in ${highest.currency}. Highest median: ${groupLabel(payBy, highest.key)}, ${money(highest.median, highest.currency)}.` +
      (lowest
        ? ` Lowest median: ${groupLabel(payBy, lowest.key)}, ${money(lowest.median, lowest.currency)}.`
        : '')
    : undefined;

  const state = query.isPending ? (
    <SectionSkeleton label={`Loading pay by ${DIMENSION_LABEL[payBy].toLowerCase()}`} />
  ) : query.isError && !stats ? (
    <SectionError what="pay by group" onRetry={() => void query.refetch()} />
  ) : rows.length === 0 ? (
    <SectionEmpty>There are no groups to show for this selection.</SectionEmpty>
  ) : undefined;

  return (
    <ChartCard
      title="Pay by group"
      description="The middle half of pay in each group (25th to 75th percentile), split at the median."
      summary={summary}
      controls={
        <SegmentedControl legend="Group by" value={payBy} options={OPTIONS} onChange={onPayBy} />
      }
      notes={<HiddenGroupsNote count={stats?.suppressedGroups ?? 0} />}
      state={state}
      chart={
        <div className="flex flex-col gap-3">
          <PayRangeChart rows={shown} dimension={payBy} />
          <ChartLegend
            items={[
              { kind: 'solid', label: '25th percentile to median' },
              { kind: 'stripes', label: 'Median to 75th percentile' },
            ]}
          />
          <p className="text-sm text-neutral-600">
            The axis starts near the lowest 25th percentile, not at zero, because each bar shows a
            range rather than a size.
          </p>
          {rows.length > shown.length ? (
            <p className="text-sm text-neutral-600">
              Showing the {shown.length} groups with the highest median, out of {rows.length}. The
              table lists all of them.
            </p>
          ) : null}
        </div>
      }
      table={
        <DataTableDisclosure>
          <table className="table">
            <caption className="sr-only">Pay by {DIMENSION_LABEL[payBy].toLowerCase()}</caption>
            <thead className="bg-neutral-50 text-neutral-700">
              <tr>
                <th scope="col" className="px-4 py-2 font-semibold">
                  {DIMENSION_LABEL[payBy]}
                </th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">
                  Employees
                </th>
                {hasExtremes ? (
                  <th scope="col" className="px-4 py-2 text-right font-semibold">
                    Minimum
                  </th>
                ) : null}
                <th scope="col" className="px-4 py-2 text-right font-semibold">
                  25th percentile
                </th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">
                  Median
                </th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">
                  Average
                </th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">
                  75th percentile
                </th>
                {hasExtremes ? (
                  <th scope="col" className="px-4 py-2 text-right font-semibold">
                    Maximum
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {rows.map((row) => (
                <tr key={`${row.key}-${row.currency}`}>
                  <th scope="row" className="px-4 py-2 font-medium">
                    {groupLabel(payBy, row.key)}
                  </th>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {row.headcount.toLocaleString('en')}
                  </td>
                  {hasExtremes && 'min' in row ? (
                    <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums">
                      {money(row.min, row.currency)}
                    </td>
                  ) : null}
                  <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums">
                    {money(row.p25, row.currency)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums">
                    {money(row.median, row.currency)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums">
                    {money(row.avg, row.currency)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums">
                    {money(row.p75, row.currency)}
                  </td>
                  {hasExtremes && 'max' in row ? (
                    <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums">
                      {money(row.max, row.currency)}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableDisclosure>
      }
    />
  );
}
