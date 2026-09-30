import type { ButtonHTMLAttributes } from 'react';

import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'signal' | 'outline-light';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  signal: 'btn-signal',
  'outline-light': 'btn-outline-light',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'md' | 'lg';
  /** Shows a spinner, sets aria-busy and blocks further clicks. */
  loading?: boolean;
}

export function buttonClass(variant: ButtonVariant, size: 'md' | 'lg' = 'md', extra?: string) {
  return [VARIANT_CLASS[variant], size === 'lg' ? 'btn-lg' : undefined, extra]
    .filter(Boolean)
    .join(' ');
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}
