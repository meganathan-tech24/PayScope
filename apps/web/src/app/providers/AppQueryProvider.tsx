import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { createQueryClient } from './query-client';

export function AppQueryProvider({
  children,
  client,
}: {
  children: ReactNode;
  /** Tests pass their own client (no retries); the app builds one. */
  client?: QueryClient;
}) {
  const [queryClient] = useState(() => client ?? createQueryClient());

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
