import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';

import {
  buttonClass,
  type ButtonLook,
  type ButtonSize,
  type ButtonTone,
  type ButtonVariant,
} from './button-styles';
import { Spinner } from './Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Older shorthand for a tone and look; `tone` and `look` win when given. */
  variant?: ButtonVariant;
  tone?: ButtonTone;
  look?: ButtonLook;
  size?: ButtonSize;
  /** Leading icon. Decorative: the text label carries the meaning. */
  icon?: LucideIcon;
  /** Shows a spinner in place of the icon, keeps the label, sets aria-busy and blocks clicks. */
  loading?: boolean;
}

function resolve(variant: ButtonVariant | undefined, tone?: ButtonTone, look?: ButtonLook) {
  if (tone || look) return { tone: tone ?? 'brand', look: look ?? 'solid' };
  return variant ?? 'primary';
}

export function Button({
  variant,
  tone,
  look,
  size = 'md',
  icon: Icon,
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClass(resolve(variant, tone, look), size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <Spinner />
      ) : Icon ? (
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
}

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  /** Required: names the action for assistive technology and is shown as the tooltip. */
  label: string;
  icon: LucideIcon;
  tone?: ButtonTone;
  look?: ButtonLook;
  size?: ButtonSize;
}

export function IconButton({
  label,
  icon: Icon,
  tone = 'neutral',
  look = 'soft',
  size = 'sm',
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={buttonClass({ tone, look }, size, className, true)}
      {...props}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
