import { describe, expect, it } from 'vitest';

// @ts-expect-error The Tailwind config is plain JavaScript without types.
import config from '../../../apps/web/tailwind.config.js';

type Palette = Record<string, string | Record<string, string>>;
const colors = config.theme.extend.colors as Palette;

function token(path: string): string {
  const [family, shade = 'DEFAULT'] = path.split('.');
  const value = colors[family as string];
  const hex = typeof value === 'string' ? value : value?.[shade];
  if (!hex) throw new Error(`Unknown colour token ${path}`);
  return hex;
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light! + 0.05) / (dark! + 0.05);
}

const WHITE = '#ffffff';

// Foreground and background for every button state and the text colours the app uses.
const PAIRS: [label: string, foreground: string, background: string][] = [
  ['brand solid', WHITE, 'brand.600'],
  ['brand solid hover', WHITE, 'brand.700'],
  ['brand solid active', WHITE, 'brand.800'],
  ['edit solid', WHITE, 'edit'],
  ['edit solid hover', WHITE, 'edit.hover'],
  ['edit soft', 'edit.text', 'edit.soft'],
  ['edit soft hover', 'edit.text', 'edit.soft-hover'],
  ['edit soft active', 'edit.active', 'edit.soft-active'],
  ['delete solid', WHITE, 'remove'],
  ['delete solid hover', WHITE, 'remove.hover'],
  ['delete solid active', WHITE, 'remove.active'],
  ['delete soft', 'remove.text', 'remove.soft'],
  ['delete soft hover', 'remove.text', 'remove.soft-hover'],
  ['delete soft active', 'remove.active', 'remove.soft-active'],
  ['download outline', 'download', WHITE],
  ['download outline hover', 'download', 'download.tint'],
  ['download outline active', 'download.active', 'download.soft'],
  ['success solid', WHITE, 'success'],
  ['success solid active', WHITE, 'success.active'],
  ['success on tint', 'success', 'success.light'],
  ['warning on tint', 'warning', 'warning.light'],
  ['neutral outline', 'neutral.700', WHITE],
  ['neutral outline hover', 'neutral.700', 'neutral.100'],
  ['neutral outline active', 'neutral.700', 'neutral.200'],
  ['disabled', 'disabled.text', 'disabled.bg'],
  ['body text', 'neutral.900', WHITE],
  ['muted text on white', 'neutral.600', WHITE],
  ['muted text on page', 'neutral.600', 'neutral.50'],
  ['link', 'brand.700', WHITE],
  ['text on dark surface', 'ink.100', 'ink'],
];

describe('theme contrast (WCAG AA, 4.5:1)', () => {
  it.each(PAIRS)('%s', (_label, foreground, background) => {
    const fg = foreground.startsWith('#') ? foreground : token(foreground);
    const bg = background.startsWith('#') ? background : token(background);
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
