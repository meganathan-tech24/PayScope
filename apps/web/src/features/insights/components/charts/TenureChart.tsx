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

import { formatMoney, formatMoneyCompact } from '../../../../lib/money';

import { AXIS_TICK, CHART_COLORS, STRIPES_LIGHT_ID } from './chart-theme';
import { ChartPatterns } from './ChartPatterns';
import { ChartTooltip, TooltipRow } from './ChartTooltip';

export interface TenurePoint {
  name: string;
  currency: string;
  median: number;
  avg: number;
}

function TenureTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: TenurePoint }[];
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <ChartTooltip title={point.name}>
      <TooltipRow label="Median" value={formatMoney(point.median, point.currency)} />
      <TooltipRow label="Average" value={formatMoney(point.avg, point.currency)} />
    </ChartTooltip>
  );
}

// Median (solid, dark) and average (striped, lighter) pay per tenure band, one currency.
export function TenureChart({ data }: { data: TenurePoint[] }) {
  const currency = data[0]?.currency ?? 'USD';
  const compact = (value: unknown) => formatMoneyCompact(Number(value), currency);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 20, right: 8, bottom: 8, left: 0 }}>
        <ChartPatterns />
        <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} interval={0} />
        <YAxis
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          width={56}
          tickCount={5}
          tickFormatter={compact}
        />
        <Tooltip content={<TenureTooltip />} cursor={{ fill: CHART_COLORS.cursor }} />
        <Bar
          dataKey="median"
          name="Median"
          fill={CHART_COLORS.dark}
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
        >
          <LabelList
            dataKey="median"
            position="top"
            fontSize={11}
            fill={CHART_COLORS.dark}
            formatter={compact}
          />
        </Bar>
        <Bar
          dataKey="avg"
          name="Average"
          fill={`url(#${STRIPES_LIGHT_ID})`}
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
