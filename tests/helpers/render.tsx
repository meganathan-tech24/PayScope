import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';

import { AppProviders } from '@web/app/providers/AppProviders';

type Entry = string | { pathname: string; state?: unknown };

// Renders inside the real providers (with a query client that never retries, so a failed
// request shows its error at once) and a memory router at `route`.
export function renderAt(ui: ReactNode, route: Entry = '/') {
  return render(
    <AppProviders queryClient={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </AppProviders>,
  );
}
