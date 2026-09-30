import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import {
  apiError,
  apiSuccess,
  stubFetch,
  stubFetchNetworkFailure,
} from '@tests/helpers/fetch-mock.js';
import { renderAt } from '@tests/helpers/render.js';
import { useAuth } from '@web/features/auth/hooks/useAuth';
import { TOKEN_KEY } from '@web/features/auth/services/token-storage';
import { apiClient } from '@web/services/api-client';

function Probe() {
  const auth = useAuth();
  return (
    <div>
      <p data-testid="status">{auth.status}</p>
      <p data-testid="role">{auth.user?.role ?? 'none'}</p>
      <p data-testid="notice">{auth.notice ?? 'none'}</p>
      <button onClick={auth.logout}>logout</button>
      <button onClick={() => void apiClient.get('/employees').catch(() => undefined)}>load</button>
      <button onClick={() => void auth.login({ email: 'ada@example.com', password: 'Passw0rd!' })}>
        login
      </button>
    </div>
  );
}

const user = (role: 'HR_MANAGER' | 'VIEWER') => ({
  id: 'u1',
  name: 'Ada',
  email: 'ada@example.com',
  role,
});

// The payload part of this token claims HR_MANAGER; the app must not believe it.
const TOKEN_CLAIMING_HR = `x.${btoa(JSON.stringify({ sub: 'u1', role: 'HR_MANAGER' }))}.y`;

const status = () => screen.getByTestId('status');

describe('AuthProvider', () => {
  it('is signed out without a stored token, and asks the server nothing', async () => {
    const { calls } = stubFetch(() => apiSuccess({}));

    renderAt(<Probe />);

    await waitFor(() => expect(status()).toHaveTextContent('unauthenticated'));
    expect(calls).toHaveLength(0);
  });

  it('re-checks a stored token with GET /auth/me and takes the role from the server', async () => {
    window.localStorage.setItem(TOKEN_KEY, TOKEN_CLAIMING_HR);
    const { calls } = stubFetch(() => apiSuccess(user('VIEWER')));

    renderAt(<Probe />);

    await waitFor(() => expect(status()).toHaveTextContent('authenticated'));
    expect(screen.getByTestId('role')).toHaveTextContent('VIEWER');
    expect(calls[0]?.url).toMatch(/\/auth\/me$/);
    expect(calls[0]?.headers.get('Authorization')).toBe(`Bearer ${TOKEN_CLAIMING_HR}`);
  });

  it('clears the token and shows the expired notice when /auth/me says 401', async () => {
    window.localStorage.setItem(TOKEN_KEY, 'expired.token.value');
    stubFetch(() => apiError(401, 'UNAUTHORIZED', 'Invalid or expired token'));

    renderAt(<Probe />);

    await waitFor(() => expect(status()).toHaveTextContent('unauthenticated'));
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(screen.getByTestId('notice')).toHaveTextContent('expired');
  });

  it('keeps the token when the server is unreachable, so a reload can retry', async () => {
    window.localStorage.setItem(TOKEN_KEY, 'valid.token.value');
    stubFetchNetworkFailure();

    renderAt(<Probe />);

    await waitFor(() => expect(status()).toHaveTextContent('unauthenticated'));
    expect(window.localStorage.getItem(TOKEN_KEY)).toBe('valid.token.value');
    expect(screen.getByTestId('notice')).toHaveTextContent('none');
  });

  it('stores the token and takes the user from the login response', async () => {
    stubFetch(() => apiSuccess({ user: user('HR_MANAGER'), token: 'new.token.value' }));
    renderAt(<Probe />);
    await waitFor(() => expect(status()).toHaveTextContent('unauthenticated'));

    await userEvent.click(screen.getByRole('button', { name: 'login' }));

    await waitFor(() => expect(status()).toHaveTextContent('authenticated'));
    expect(screen.getByTestId('role')).toHaveTextContent('HR_MANAGER');
    expect(window.localStorage.getItem(TOKEN_KEY)).toBe('new.token.value');
  });

  it('logs out: token removed, user forgotten, no expired notice', async () => {
    window.localStorage.setItem(TOKEN_KEY, 'valid.token.value');
    stubFetch(() => apiSuccess(user('VIEWER')));
    renderAt(<Probe />);
    await waitFor(() => expect(status()).toHaveTextContent('authenticated'));

    await userEvent.click(screen.getByRole('button', { name: 'logout' }));

    expect(status()).toHaveTextContent('unauthenticated');
    expect(screen.getByTestId('role')).toHaveTextContent('none');
    expect(screen.getByTestId('notice')).toHaveTextContent('none');
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('logs out automatically when a later request comes back 401', async () => {
    window.localStorage.setItem(TOKEN_KEY, 'valid.token.value');
    stubFetch(({ url }) =>
      url.endsWith('/auth/me')
        ? apiSuccess(user('VIEWER'))
        : apiError(401, 'UNAUTHORIZED', 'Invalid or expired token'),
    );
    renderAt(<Probe />);
    await waitFor(() => expect(status()).toHaveTextContent('authenticated'));

    await userEvent.click(screen.getByRole('button', { name: 'load' }));

    await waitFor(() => expect(status()).toHaveTextContent('unauthenticated'));
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(screen.getByTestId('notice')).toHaveTextContent('expired');
  });
});
