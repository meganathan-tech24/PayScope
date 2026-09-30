import { CHART_COLORS, STRIPES_ID, STRIPES_LIGHT_ID } from './chart-theme';

/** SVG <defs> for the striped fills, placed inside a chart. */
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
      <pattern
        id={STRIPES_LIGHT_ID}
        width="6"
        height="6"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <rect width="6" height="6" fill={CHART_COLORS.mid} />
        <rect width="2.5" height="6" fill="#ffffff" fillOpacity="0.6" />
      </pattern>
    </defs>
  );
}
