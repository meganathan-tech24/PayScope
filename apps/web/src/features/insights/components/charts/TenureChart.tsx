import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { formatMoney, formatMoneyCompact } from '../../../../lib/money';

import { AXIS_TICK, CHART_COLORS, STRIPES_ID } from './chart-theme';
import { ChartPatterns } from './ChartPatterns';

export interface TenurePoint {
  name: string;
  currency: string;
  median: number;
  avg: number;
}

// Median (solid) and average (striped) pay per tenure band, one currency.
export function TenureChart({ data }: { data: TenurePoint[] }) {
  const currency = data[0]?.currency ?? 'USD';

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <ChartPatterns />
        <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
        <XAxis dataKey="name" tick={AXIS_TICK} interval={0} />
        <YAxis
          tick={AXIS_TICK}
          width={56}
          tickCount={5}
          tickFormatter={(value: number) => formatMoneyCompact(value, currency)}
        />
        <Tooltip formatter={(value) => formatMoney(Number(value), currency)} />
        <Bar dataKey="median" name="Median" fill={CHART_COLORS.base} isAnimationActive={false} />
        <Bar dataKey="avg" name="Average" fill={`url(#${STRIPES_ID})`} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
