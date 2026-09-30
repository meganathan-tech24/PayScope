import type { ReactNode } from 'react';

import { AuthProvider } from '../../features/auth/hooks/AuthProvider';

import { AppQueryProvider } from './AppQueryProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppQueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </AppQueryProvider>
  );
}
