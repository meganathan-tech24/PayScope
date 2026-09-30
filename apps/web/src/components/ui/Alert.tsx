import type { ReactNode } from 'react';

type AlertTone = 'error' | 'info' | 'success';

// Errors interrupt (role="alert"); info and success are announced politely.
export function Alert({ tone, children }: { tone: AlertTone; children: ReactNode }) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`alert-${tone}`}>
      <div>{children}</div>
    </div>
  );
}
