import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';

import { AppProviders } from '@web/app/providers/AppProviders';

// Renders inside the real providers and a memory router at `route`.
export function renderAt(ui: ReactNode, route = '/') {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </AppProviders>,
  );
}
