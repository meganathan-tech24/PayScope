import type { InsightStatsRow, InsightStatsRowBasic } from '@payscope/types';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatMoney, formatMoneyCompact } from '../../../../lib/money';
import { axisStart, chartHeight, groupLabel, truncate, type Dimension } from '../../lib/labels';

import { AXIS_TICK, CHART_COLORS, STRIPES_ID } from './chart-theme';
import { ChartPatterns } from './ChartPatterns';
import { ChartTooltip, TooltipRow } from './ChartTooltip';

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
    <ChartTooltip title={point.full}>
      <TooltipRow label="75th percentile" value={formatMoney(point.p75, point.currency)} />
      <TooltipRow label="Median" value={formatMoney(point.median, point.currency)} />
      <TooltipRow label="25th percentile" value={formatMoney(point.p25, point.currency)} />
    </ChartTooltip>
  );
}

interface ShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
}

// The median to 75th percentile segment: striped, with a dark line on its left edge, which
// is the median.
function UpperShape({ x = 0, y = 0, width = 0, height = 0, fill }: ShapeProps) {
  return (
    <g>
      <Rectangle x={x} y={y} width={width} height={height} fill={fill} radius={[0, 4, 4, 0]} />
      <line
        x1={x}
        x2={x}
        y1={y - 2}
        y2={y + height + 2}
        stroke={CHART_COLORS.dark}
        strokeWidth={2}
      />
    </g>
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
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 0 }}>
          <ChartPatterns />
          <CartesianGrid horizontal={false} stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
          <XAxis
            type="number"
            domain={[start, 'auto']}
            allowDataOverflow
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => formatMoneyCompact(value, currency)}
            tickCount={4}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={112}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <Tooltip content={<PayTooltip />} cursor={{ fill: CHART_COLORS.cursor }} />
          <Bar dataKey="base" stackId="pay" fill="transparent" isAnimationActive={false} />
          <Bar
            dataKey="lower"
            stackId="pay"
            fill={CHART_COLORS.base}
            radius={[4, 0, 0, 4]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="upper"
            stackId="pay"
            fill={`url(#${STRIPES_ID})`}
            shape={UpperShape}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="median"
              position="right"
              fontSize={12}
              fill={CHART_COLORS.dark}
              formatter={(value: unknown) => formatMoneyCompact(Number(value), currency)}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
