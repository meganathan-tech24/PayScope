import { CircleAlert, CircleCheck, Info, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type AlertTone = 'error' | 'info' | 'success';

// Class names are written out in full: a name built from the tone would not be found by
// Tailwind, and the alert would render unstyled.
const TONE: Record<AlertTone, { className: string; icon: LucideIcon; iconClass: string }> = {
  error: { className: 'alert-error', icon: CircleAlert, iconClass: 'text-danger' },
  info: { className: 'alert-info', icon: Info, iconClass: 'text-info' },
  success: { className: 'alert-success', icon: CircleCheck, iconClass: 'text-success' },
};

// Errors interrupt (role="alert"); info and success are announced politely. The icon and the
// wording carry the meaning as well as the colour.
export function Alert({ tone, children }: { tone: AlertTone; children: ReactNode }) {
  const { className, icon: Icon, iconClass } = TONE[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={className}>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`} aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
