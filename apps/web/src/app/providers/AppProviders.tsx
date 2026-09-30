import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { AuthProvider } from '../../features/auth/hooks/AuthProvider';

import { AppQueryProvider } from './AppQueryProvider';

export function AppProviders({
  children,
  queryClient,
}: {
  children: ReactNode;
  queryClient?: QueryClient;
}) {
  return (
    <AppQueryProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </AppQueryProvider>
  );
}
