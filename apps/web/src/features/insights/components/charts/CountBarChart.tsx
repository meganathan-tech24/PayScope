import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { chartHeight, truncate } from '../../lib/labels';

import { AXIS_TICK, CHART_COLORS, rampColor } from './chart-theme';
import { ChartTooltip, TooltipRow } from './ChartTooltip';

export interface CountPoint {
  name: string;
  full: string;
  count: number;
}

function CountTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: { payload: CountPoint }[];
  unit: string;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <ChartTooltip title={point.full}>
      <TooltipRow label="Employees" value={`${point.count.toLocaleString('en')} ${unit}`} />
    </ChartTooltip>
  );
}

// Counts of people per group (headcount) or per band. Horizontal bars keep long labels
// readable on a phone; a column layout suits the salary bands, which read left to right.
// Every bar has its value written on it, and a darker bar means more people.
export function CountBarChart({
  data,
  layout,
  unit,
}: {
  data: CountPoint[];
  layout: 'rows' | 'columns';
  unit: string;
}) {
  const points = data.map((point) => ({
    ...point,
    name: layout === 'rows' ? truncate(point.name) : point.name,
  }));
  const max = Math.max(0, ...points.map((point) => point.count));
  const cells = points.map((point, index) => (
    <Cell key={index} fill={rampColor(point.count, max)} />
  ));

  if (layout === 'columns') {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={points} margin={{ top: 20, right: 8, bottom: 8, left: 0 }}>
          <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={12}
          />
          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={36}
          />
          <Tooltip content={<CountTooltip unit={unit} />} cursor={{ fill: CHART_COLORS.cursor }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {cells}
            <LabelList dataKey="count" position="top" fontSize={12} fill={CHART_COLORS.text} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={chartHeight(points.length)}>
      <BarChart data={points} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 0 }}>
        <CartesianGrid horizontal={false} stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
        <XAxis
          type="number"
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
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
        <Tooltip content={<CountTooltip unit={unit} />} cursor={{ fill: CHART_COLORS.cursor }} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} isAnimationActive={false}>
          {cells}
          <LabelList dataKey="count" position="right" fontSize={12} fill={CHART_COLORS.text} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
