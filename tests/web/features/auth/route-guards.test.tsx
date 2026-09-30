import { screen, waitFor } from '@testing-library/react';
import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';

import { apiError, apiSuccess, stubFetch } from '@tests/helpers/fetch-mock.js';
import { renderAt } from '@tests/helpers/render.js';
import { ProtectedRoute } from '@web/features/auth/components/ProtectedRoute';
import { PublicOnlyRoute } from '@web/features/auth/components/PublicOnlyRoute';
import { RoleGuard } from '@web/features/auth/components/RoleGuard';
import { TOKEN_KEY } from '@web/features/auth/services/token-storage';

function LoginPage() {
  const from = (useLocation().state as { from?: string } | null)?.from ?? 'none';
  return <p>Login page (from: {from})</p>;
}

function TestRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<p>Register page</p>} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<p>App page</p>} />
        <Route element={<RoleGuard roles={['HR_MANAGER']} />}>
          <Route path="/app/hr" element={<p>HR only page</p>} />
        </Route>
      </Route>
      <Route path="/403" element={<p>Forbidden page</p>} />
    </Routes>
  );
}

const signedInAs = (role: 'HR_MANAGER' | 'VIEWER') => {
  window.localStorage.setItem(TOKEN_KEY, 'valid.token.value');
  stubFetch(() => apiSuccess({ id: 'u1', name: 'Ada', email: 'ada@example.com', role }));
};

describe('ProtectedRoute', () => {
  it('sends a signed-out visitor to /login and remembers where they were going', async () => {
    stubFetch(() => apiSuccess({}));

    renderAt(<TestRoutes />, '/app?tab=1');

    expect(await screen.findByText('Login page (from: /app?tab=1)')).toBeInTheDocument();
  });

  it('shows the page to a signed-in user', async () => {
    signedInAs('VIEWER');

    renderAt(<TestRoutes />, '/app');

    expect(await screen.findByText('App page')).toBeInTheDocument();
  });

  it('shows a spinner while the session is checked, not the login page', async () => {
    window.localStorage.setItem(TOKEN_KEY, 'valid.token.value');
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => (release = resolve));
    stubFetch(async () => {
      await gate;
      return apiSuccess({ id: 'u1', name: 'Ada', email: 'ada@example.com', role: 'VIEWER' });
    });

    renderAt(<TestRoutes />, '/app');

    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(screen.queryByText(/Login page/)).not.toBeInTheDocument();
    release();
    expect(await screen.findByText('App page')).toBeInTheDocument();
  });

  it('sends the user to /login when their token turns out to be expired', async () => {
    window.localStorage.setItem(TOKEN_KEY, 'expired.token.value');
    stubFetch(() => apiError(401, 'UNAUTHORIZED', 'Invalid or expired token'));

    renderAt(<TestRoutes />, '/app');

    expect(await screen.findByText(/Login page/)).toBeInTheDocument();
  });
});

describe('RoleGuard', () => {
  it('lets the allowed role through', async () => {
    signedInAs('HR_MANAGER');

    renderAt(<TestRoutes />, '/app/hr');

    expect(await screen.findByText('HR only page')).toBeInTheDocument();
  });

  it('sends another role to the 403 page', async () => {
    signedInAs('VIEWER');

    renderAt(<TestRoutes />, '/app/hr');

    expect(await screen.findByText('Forbidden page')).toBeInTheDocument();
    expect(screen.queryByText('HR only page')).not.toBeInTheDocument();
  });
});

describe('PublicOnlyRoute', () => {
  it.each(['/login', '/register'])(
    'redirects a signed-in user away from %s to /app',
    async (path) => {
      signedInAs('VIEWER');

      renderAt(<TestRoutes />, path);

      expect(await screen.findByText('App page')).toBeInTheDocument();
    },
  );

  it('shows the login page to a signed-out visitor', async () => {
    stubFetch(() => apiSuccess({}));

    renderAt(<TestRoutes />, '/login');

    await waitFor(() => expect(screen.getByText(/Login page/)).toBeInTheDocument());
  });
});
