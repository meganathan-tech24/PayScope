import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { chartHeight, truncate } from '../../lib/labels';

import { AXIS_TICK, CHART_COLORS } from './chart-theme';

export interface CountPoint {
  name: string;
  full: string;
  count: number;
}

// Counts of people per group (headcount) or per band. Horizontal bars keep long labels
// readable on a phone; a column layout suits the salary bands, which read left to right.
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

  if (layout === 'columns') {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={points} margin={{ top: 16, right: 8, bottom: 8, left: 0 }}>
          <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
          <XAxis dataKey="name" tick={AXIS_TICK} interval="preserveStartEnd" minTickGap={12} />
          <YAxis tick={AXIS_TICK} allowDecimals={false} width={36} />
          <Tooltip
            formatter={(value) => [`${value} ${unit}`, 'Employees']}
            labelFormatter={(_, p) => p?.[0]?.payload.full ?? ''}
          />
          <Bar dataKey="count" fill={CHART_COLORS.base} isAnimationActive={false}>
            <LabelList dataKey="count" position="top" fontSize={12} fill={CHART_COLORS.text} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={chartHeight(points.length)}>
      <BarChart data={points} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 0 }}>
        <CartesianGrid horizontal={false} stroke={CHART_COLORS.grid} />
        <XAxis type="number" tick={AXIS_TICK} allowDecimals={false} tickCount={4} />
        <YAxis type="category" dataKey="name" width={112} tick={AXIS_TICK} interval={0} />
        <Tooltip
          formatter={(value) => [`${value} ${unit}`, 'Employees']}
          labelFormatter={(_, p) => p?.[0]?.payload.full ?? ''}
        />
        <Bar dataKey="count" fill={CHART_COLORS.base} isAnimationActive={false}>
          <LabelList dataKey="count" position="right" fontSize={12} fill={CHART_COLORS.text} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
