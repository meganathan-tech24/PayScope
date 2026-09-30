// Colours mirror the `chart` scale in tailwind.config.js. The scale is one sequential blue
// ramp, so it keeps its order in greyscale. Series are also told apart by pattern and by
// text (legend, value labels, the data table), never by colour alone.
export const CHART_COLORS = {
  pale: '#dbeafe', // chart-1
  light: '#93b4e6', // chart-2
  mid: '#5b86c4', // chart-3
  base: '#2f5c99', // chart-4
  dark: '#1e3a5f', // chart-5, also the median marker
  grid: '#e2e8f0',
  text: '#475569', // neutral-600
  cursor: '#f1f5f9', // neutral-100
} as const;

/** Five steps from light to dark: more people in a band means a darker bar. */
const RAMP = [
  CHART_COLORS.pale,
  CHART_COLORS.light,
  CHART_COLORS.mid,
  CHART_COLORS.base,
  CHART_COLORS.dark,
] as const;

export function rampColor(value: number, max: number): string {
  if (max <= 0) return RAMP[0];
  const step = Math.min(RAMP.length - 1, Math.floor((value / max) * RAMP.length));
  return RAMP[step] ?? RAMP[0];
}

export const STRIPES_ID = 'chart-stripes';
export const STRIPES_LIGHT_ID = 'chart-stripes-light';

export const AXIS_TICK = { fontSize: 12, fill: CHART_COLORS.text } as const;
