export type ButtonVariant = 'primary' | 'secondary' | 'signal' | 'outline-light';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  signal: 'btn-signal',
  'outline-light': 'btn-outline-light',
};

export function buttonClass(variant: ButtonVariant, size: 'md' | 'lg' = 'md', extra?: string) {
  return [VARIANT_CLASS[variant], size === 'lg' ? 'btn-lg' : undefined, extra]
    .filter(Boolean)
    .join(' ');
}
