export type ButtonTone = 'brand' | 'edit' | 'danger' | 'download' | 'success' | 'neutral';
export type ButtonLook = 'solid' | 'soft' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

// Older names, kept so existing call sites and the landing page's dark-surface buttons still work.
export type ButtonVariant = 'primary' | 'secondary' | 'signal' | 'outline-light' | 'danger';

export interface ButtonStyle {
  tone: ButtonTone;
  look: ButtonLook;
}

const LEGACY: Record<ButtonVariant, ButtonStyle | string> = {
  primary: { tone: 'brand', look: 'solid' },
  secondary: { tone: 'neutral', look: 'outline' },
  danger: { tone: 'danger', look: 'solid' },
  signal: 'btn-signal',
  'outline-light': 'btn-outline-light',
};

// One fixed colour per action type (see the Buttons reference in docs/design-notes.md).
// Full class names are written out so Tailwind can see them.
const STYLE: Record<ButtonLook, Record<ButtonTone, string>> = {
  solid: {
    brand: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
    edit: 'bg-edit text-white hover:bg-edit-hover active:bg-edit-active',
    danger: 'bg-remove text-white hover:bg-remove-hover active:bg-remove-active',
    download: 'bg-download text-white hover:bg-download-hover active:bg-download-active',
    success: 'bg-success text-white hover:bg-success-hover active:bg-success-active',
    neutral: 'bg-neutral-800 text-white hover:bg-neutral-900 active:bg-neutral-900',
  },
  soft: {
    brand: 'bg-brand-100 text-brand-700 hover:bg-brand-200 active:bg-brand-300',
    edit: 'bg-edit-soft text-edit-text hover:bg-edit-soft-hover active:bg-edit-soft-active',
    danger:
      'bg-remove-soft text-remove-text hover:bg-remove-soft-hover active:bg-remove-soft-active',
    download: 'bg-download-soft text-download-hover hover:bg-download-soft active:bg-download-soft',
    success: 'bg-success-light text-success hover:bg-green-200 active:bg-green-300',
    neutral: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:bg-neutral-300',
  },
  outline: {
    brand: 'border-brand-600 bg-white text-brand-700 hover:bg-brand-50 active:bg-brand-100',
    edit: 'border-edit bg-white text-edit-text hover:bg-edit-tint active:bg-edit-soft',
    danger: 'border-remove bg-white text-remove-text hover:bg-remove-tint active:bg-remove-soft',
    download:
      'border-download bg-white text-download hover:bg-download-tint active:bg-download-soft',
    success: 'border-success bg-white text-success hover:bg-success-light active:bg-green-200',
    neutral:
      'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200',
  },
  ghost: {
    brand: 'text-brand-700 hover:bg-brand-50 active:bg-brand-100',
    edit: 'text-edit-text hover:bg-edit-tint active:bg-edit-soft',
    danger: 'text-remove-text hover:bg-remove-tint active:bg-remove-soft',
    download: 'text-download hover:bg-download-tint active:bg-download-soft',
    success: 'text-success hover:bg-success-light active:bg-green-200',
    neutral: 'text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200',
  },
};

// 44px minimum touch target below md; compact sizes from md up.
const SIZE: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-3 text-sm md:min-h-9',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-6 text-base',
};

const ICON_SIZE: Record<ButtonSize, string> = {
  sm: 'h-11 w-11 md:h-9 md:w-9',
  md: 'h-11 w-11',
  lg: 'h-12 w-12',
};

export function buttonClass(
  variant: ButtonVariant | ButtonStyle,
  size: ButtonSize = 'md',
  extra?: string,
  iconOnly = false,
) {
  const resolved = typeof variant === 'string' ? LEGACY[variant] : variant;
  const colour = typeof resolved === 'string' ? resolved : STYLE[resolved.look][resolved.tone];
  const outlined = typeof resolved !== 'string' && resolved.look === 'outline';
  return [
    'btn',
    typeof resolved === 'string' ? undefined : outlined ? 'border' : 'border border-transparent',
    colour,
    iconOnly ? `${ICON_SIZE[size]} shrink-0 p-0` : SIZE[size],
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}
