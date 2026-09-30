import { CHART_COLORS, STRIPES_ID } from './chart-theme';

/** SVG <defs> for the striped fill, placed inside a chart. */
export function ChartPatterns() {
  return (
    <defs>
      <pattern
        id={STRIPES_ID}
        width="6"
        height="6"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <rect width="6" height="6" fill={CHART_COLORS.base} />
        <rect width="2.5" height="6" fill="#ffffff" fillOpacity="0.55" />
      </pattern>
    </defs>
  );
}
