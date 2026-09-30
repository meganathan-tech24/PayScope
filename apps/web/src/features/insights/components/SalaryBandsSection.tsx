import { formatMoney, formatMoneyCompact } from '../../../lib/money';
import { useSalaryBands } from '../hooks/useInsights';

import { ChartCard } from './charts/ChartCard';
import { CountBarChart } from './charts/CountBarChart';
import { DataTableDisclosure } from './charts/DataTableDisclosure';
import { SectionEmpty, SectionError, SectionSkeleton } from './SectionStates';

export function SalaryBandsSection({ usd, currency }: { usd: boolean; currency: string }) {
  const query = useSalaryBands(usd, currency);
  const bands = query.data;
  const buckets = bands?.buckets ?? [];
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const code = bands?.currency ?? currency;
  const range = (from: number, to: number) =>
    from === to
      ? formatMoney(from, code)
      : `${formatMoney(from, code)} to ${formatMoney(to, code)}`;
  const percent = (count: number) =>
    total === 0 ? '0%' : `${Math.round((count / total) * 1000) / 10}%`;
  const largest = [...buckets].sort((a, b) => b.count - a.count)[0];

  const state = query.isPending ? (
    <SectionSkeleton label="Loading salary bands" />
  ) : query.isError && !bands ? (
    <SectionError what="salary bands" onRetry={() => void query.refetch()} />
  ) : bands?.suppressed ? (
    <SectionEmpty>
      There are too few employees in this selection to show a distribution (fewer than 5).
    </SectionEmpty>
  ) : buckets.length === 0 ? (
    <SectionEmpty>There are no salaries to show for this selection.</SectionEmpty>
  ) : undefined;

  return (
    <ChartCard
      title="Salary bands"
      description="How many employees are paid within each band, in equal steps from the lowest to the highest salary."
      summary={
        largest && bands
          ? `Salary bands in ${code} for ${bands.headcount.toLocaleString('en')} employees. Largest band: ${range(largest.from, largest.to)}, ${largest.count.toLocaleString('en')} employees (${percent(largest.count)}).`
          : undefined
      }
      state={state}
      chart={
        <div className="flex flex-col gap-2">
          <CountBarChart
            layout="columns"
            unit="employees"
            data={buckets.map((bucket) => ({
              name: formatMoneyCompact(bucket.from, code),
              full: range(bucket.from, bucket.to),
              count: bucket.count,
            }))}
          />
          <p className="text-sm text-neutral-600">
            Each bar is labelled with the start of its band; the table gives both ends.
          </p>
        </div>
      }
      table={
        <DataTableDisclosure>
          <table className="table">
            <caption className="sr-only">Salary bands in {code}</caption>
            <thead className="bg-neutral-50 text-neutral-700">
              <tr>
                <th scope="col" className="px-4 py-2 font-semibold">
                  Band
                </th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">
                  Employees
                </th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">
                  Share
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {buckets.map((bucket) => (
                <tr key={bucket.from}>
                  <th scope="row" className="whitespace-nowrap px-4 py-2 font-medium">
                    {range(bucket.from, bucket.to)}
                  </th>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {bucket.count.toLocaleString('en')}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{percent(bucket.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableDisclosure>
      }
    />
  );
}
