import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { useHeadcount } from '../hooks/useInsights';
import { DIMENSION_LABEL, groupLabel } from '../lib/labels';
import type { HeadcountBy } from '../services/insights.service';

import { ChartCard } from './charts/ChartCard';
import { CountBarChart } from './charts/CountBarChart';
import { DataTableDisclosure } from './charts/DataTableDisclosure';
import { SectionEmpty, SectionError, SectionSkeleton } from './SectionStates';

const CHART_ROWS = 15;
const DIMENSIONS = ['country', 'department', 'jobTitle', 'employmentType'] as const;
const OPTIONS = DIMENSIONS.map((value) => ({ value, label: DIMENSION_LABEL[value] }));

interface Props {
  by: HeadcountBy;
  onBy: (by: HeadcountBy) => void;
}

// Counts of people, so this section is the same in every currency and for both roles.
export function HeadcountSection({ by, onBy }: Props) {
  const query = useHeadcount(by);
  const rows = [...(query.data ?? [])].sort((a, b) => b.headcount - a.headcount);
  const total = rows.reduce((sum, row) => sum + row.headcount, 0);
  const shown = rows.slice(0, CHART_ROWS);
  const largest = rows[0];
  const percent = (count: number) =>
    total === 0 ? '0%' : `${Math.round((count / total) * 1000) / 10}%`;

  const state = query.isPending ? (
    <SectionSkeleton label="Loading headcount" />
  ) : query.isError && !query.data ? (
    <SectionError what="headcount" onRetry={() => void query.refetch()} />
  ) : rows.length === 0 ? (
    <SectionEmpty>There are no employees to count yet.</SectionEmpty>
  ) : undefined;

  return (
    <ChartCard
      title="Headcount"
      description="How many employees there are in each group."
      summary={
        largest
          ? `Headcount by ${DIMENSION_LABEL[by].toLowerCase()}, ${total.toLocaleString('en')} employees in total. Largest group: ${groupLabel(by, largest.key)}, ${largest.headcount.toLocaleString('en')} employees (${percent(largest.headcount)}).`
          : undefined
      }
      controls={<SegmentedControl legend="Count by" value={by} options={OPTIONS} onChange={onBy} />}
      state={state}
      chart={
        <div className="flex flex-col gap-3">
          <CountBarChart
            layout="rows"
            unit="employees"
            data={shown.map((row) => ({
              name: groupLabel(by, row.key),
              full: groupLabel(by, row.key),
              count: row.headcount,
            }))}
          />
          {rows.length > shown.length ? (
            <p className="text-sm text-neutral-600">
              Showing the {shown.length} largest groups out of {rows.length}. The table lists all of
              them.
            </p>
          ) : null}
        </div>
      }
      table={
        <DataTableDisclosure>
          <table className="table">
            <caption className="sr-only">Headcount by {DIMENSION_LABEL[by].toLowerCase()}</caption>
            <thead className="bg-neutral-50 text-neutral-700">
              <tr>
                <th scope="col" className="px-4 py-2 font-semibold">
                  {DIMENSION_LABEL[by]}
                </th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">
                  Employees
                </th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">
                  Share
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <th scope="row" className="px-4 py-2 font-medium">
                    {groupLabel(by, row.key)}
                  </th>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {row.headcount.toLocaleString('en')}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{percent(row.headcount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableDisclosure>
      }
    />
  );
}
