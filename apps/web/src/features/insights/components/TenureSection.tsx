import { formatMoney } from '../../../lib/money';
import { useTenure } from '../hooks/useInsights';
import { tenureLabel } from '../lib/labels';

import { ChartCard } from './charts/ChartCard';
import { ChartLegend } from './charts/ChartLegend';
import { DataTableDisclosure } from './charts/DataTableDisclosure';
import { TenureChart } from './charts/TenureChart';
import { HiddenGroupsNote } from './InsightNotes';
import { SectionEmpty, SectionError, SectionSkeleton } from './SectionStates';

export function TenureSection({ usd, currency }: { usd: boolean; currency: string }) {
  const query = useTenure(usd, currency);
  const tenure = query.data;
  const bands = tenure?.bands ?? [];
  const first = bands[0];
  const last = bands.length > 1 ? bands[bands.length - 1] : undefined;

  const state = query.isPending ? (
    <SectionSkeleton label="Loading pay versus tenure" />
  ) : query.isError && !tenure ? (
    <SectionError what="pay versus tenure" onRetry={() => void query.refetch()} />
  ) : bands.length === 0 ? (
    <SectionEmpty>There is no tenure data to show for this selection.</SectionEmpty>
  ) : undefined;

  return (
    <ChartCard
      title="Pay versus tenure"
      description="Median and average pay by how long people have worked here."
      summary={
        first
          ? `Pay by tenure in ${first.currency}. Median pay is ${formatMoney(first.median, first.currency)} for ${tenureLabel(first.band).toLowerCase()}` +
            (last
              ? ` and ${formatMoney(last.median, last.currency)} for ${tenureLabel(last.band).toLowerCase()}.`
              : '.')
          : undefined
      }
      notes={<HiddenGroupsNote count={tenure?.suppressedGroups ?? 0} />}
      state={state}
      chart={
        <div className="flex flex-col gap-3">
          <TenureChart
            data={bands.map((band) => ({
              name: tenureLabel(band.band),
              currency: band.currency,
              median: band.median,
              avg: band.avg,
            }))}
          />
          <ChartLegend
            items={[
              { kind: 'median', label: 'Median pay' },
              { kind: 'average', label: 'Average pay' },
            ]}
          />
        </div>
      }
      table={
        <DataTableDisclosure>
          <table className="table">
            <caption className="sr-only">Pay versus tenure</caption>
            <thead className="bg-neutral-50 text-neutral-700">
              <tr>
                <th scope="col" className="px-4 py-2 font-semibold">
                  Tenure
                </th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">
                  Employees
                </th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">
                  Median
                </th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">
                  Average
                </th>
              </tr>
            </thead>
            <tbody>
              {bands.map((band) => (
                <tr key={`${band.band}-${band.currency}`}>
                  <th scope="row" className="whitespace-nowrap px-4 py-2 font-medium">
                    {tenureLabel(band.band)}
                  </th>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {band.headcount.toLocaleString('en')}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums">
                    {formatMoney(band.median, band.currency)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums">
                    {formatMoney(band.avg, band.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableDisclosure>
      }
    />
  );
}
