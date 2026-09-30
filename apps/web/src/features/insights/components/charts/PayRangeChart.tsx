import type { InsightStatsRow, InsightStatsRowBasic } from '@payscope/types';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { formatMoney, formatMoneyCompact } from '../../../../lib/money';
import { axisStart, chartHeight, groupLabel, truncate, type Dimension } from '../../lib/labels';

import { AXIS_TICK, CHART_COLORS, STRIPES_ID } from './chart-theme';
import { ChartPatterns } from './ChartPatterns';

type Row = InsightStatsRow | InsightStatsRowBasic;

interface Point {
  name: string;
  full: string;
  currency: string;
  base: number;
  lower: number;
  upper: number;
  p25: number;
  median: number;
  p75: number;
}

function toPoint(dimension: Dimension, row: Row): Point {
  const full = groupLabel(dimension, row.key);
  return {
    name: truncate(full),
    full,
    currency: row.currency,
    base: row.p25,
    lower: row.median - row.p25,
    upper: row.p75 - row.median,
    p25: row.p25,
    median: row.median,
    p75: row.p75,
  };
}

function PayTooltip({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="rounded-md border border-neutral-200 bg-white p-3 text-sm shadow-card">
      <p className="font-semibold text-neutral-900">{point.full}</p>
      <p>25th percentile: {formatMoney(point.p25, point.currency)}</p>
      <p>Median: {formatMoney(point.median, point.currency)}</p>
      <p>75th percentile: {formatMoney(point.p75, point.currency)}</p>
    </div>
  );
}

// Each bar spans the middle half of pay (25th to 75th percentile), split at the median.
// One currency per chart, so the axis is comparable.
export function PayRangeChart({ rows, dimension }: { rows: Row[]; dimension: Dimension }) {
  const data = rows.map((row) => toPoint(dimension, row));
  const currency = rows[0]?.currency ?? 'USD';
  const start = axisStart(Math.min(...rows.map((row) => row.p25)));

  return (
    <div className="min-w-0">
      <ResponsiveContainer width="100%" height={chartHeight(data.length)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
          <ChartPatterns />
          <CartesianGrid horizontal={false} stroke={CHART_COLORS.grid} />
          <XAxis
            type="number"
            domain={[start, 'auto']}
            allowDataOverflow
            tick={AXIS_TICK}
            tickFormatter={(value: number) => formatMoneyCompact(value, currency)}
            tickCount={4}
          />
          <YAxis type="category" dataKey="name" width={112} tick={AXIS_TICK} interval={0} />
          <Tooltip content={<PayTooltip />} cursor={{ fill: '#f3f4f6' }} />
          <Bar dataKey="base" stackId="pay" fill="transparent" isAnimationActive={false} />
          <Bar dataKey="lower" stackId="pay" fill={CHART_COLORS.base} isAnimationActive={false} />
          <Bar
            dataKey="upper"
            stackId="pay"
            fill={`url(#${STRIPES_ID})`}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
