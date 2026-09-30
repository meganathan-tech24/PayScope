// Colours come from the Tailwind theme (tailwind.config.js). Series are also told apart by
// pattern and by text in the legend and the data table, never by colour alone.
export const CHART_COLORS = {
  base: '#2563eb', // brand-600
  accent: '#0b1c2c', // ink
  highlight: '#f5b83d', // signal
  grid: '#e5e7eb', // neutral-200
  text: '#374151', // neutral-700
} as const;

export const STRIPES_ID = 'chart-stripes';

export const AXIS_TICK = { fontSize: 12, fill: CHART_COLORS.text } as const;
