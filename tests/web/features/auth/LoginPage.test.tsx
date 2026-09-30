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
import { AppRoutes } from '@web/app/router/routes';
import { TOKEN_KEY } from '@web/features/auth/services/token-storage';

const user = { id: 'u1', name: 'Ada Lovelace', email: 'ada@example.com', role: 'VIEWER' };
const loginOk = () => apiSuccess({ user, token: 'issued.token.value' });

async function fillAndSubmit(email = 'ada@example.com', password = 'Passw0rd!') {
  if (email) await userEvent.type(screen.getByLabelText('Email'), email);
  if (password) await userEvent.type(screen.getByLabelText('Password'), password);
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
}

describe('login page', () => {
  it('has one h1, labelled email and password fields, and a link to register', async () => {
    stubFetch(() => apiSuccess({}));

    renderAt(<AppRoutes />, '/login');

    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute(
      'href',
      '/register',
    );
    // Sign in takes an email and a password only: no role or portal choice.
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('signs in, stores the session, sends only email and password, and lands on /app', async () => {
    const { calls } = stubFetch(loginOk);
    renderAt(<AppRoutes />, '/login');

    await userEvent.type(await screen.findByLabelText('Email'), '  Ada@Example.com ');
    await userEvent.type(screen.getByLabelText('Password'), 'Passw0rd!');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(calls[0]?.json).toEqual({ email: 'ada@example.com', password: 'Passw0rd!' });
    expect(window.localStorage.getItem(TOKEN_KEY)).toBe('issued.token.value');
  });

  it('shows one generic message for a wrong password and stays on the page', async () => {
    stubFetch(() => apiError(401, 'AUTH_INVALID_CREDENTIALS', 'Invalid credentials'));
    renderAt(<AppRoutes />, '/login');
    await screen.findByLabelText('Email');

    await fillAndSubmit('ada@example.com', 'WrongPassw0rd');

    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.');
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('says exactly the same for an unknown email', async () => {
    stubFetch(() => apiError(401, 'AUTH_INVALID_CREDENTIALS', 'Invalid credentials'));
    renderAt(<AppRoutes />, '/login');
    await screen.findByLabelText('Email');

    await fillAndSubmit('nobody@example.com', 'Passw0rd!');

    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.');
  });

  it('shows inline errors for empty fields without calling the server, and focuses the first', async () => {
    const { calls } = stubFetch(() => apiSuccess({}));
    renderAt(<AppRoutes />, '/login');
    await screen.findByLabelText('Email');

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Invalid email address');
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('Password is required');
    expect(screen.getByLabelText('Email')).toHaveFocus();
    expect(calls).toHaveLength(0);
  });

  it('shows a field error after leaving an invalid field', async () => {
    stubFetch(() => apiSuccess({}));
    renderAt(<AppRoutes />, '/login');

    await userEvent.type(await screen.findByLabelText('Email'), 'not-an-email');
    await userEvent.tab();

    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Invalid email address')).toBeInTheDocument();
  });

  it('shows a rate limit message for 429', async () => {
    stubFetch(() => apiError(429, 'RATE_LIMITED', 'Too many requests, please try again later'));
    renderAt(<AppRoutes />, '/login');
    await screen.findByLabelText('Email');

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent(/too many attempts/i);
  });

  it('says so when the server cannot be reached', async () => {
    stubFetchNetworkFailure();
    renderAt(<AppRoutes />, '/login');
    await screen.findByLabelText('Email');

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not reach the server/i);
  });

  it('disables the button and shows progress while signing in', async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => (release = resolve));
    stubFetch(async () => {
      await gate;
      return loginOk();
    });
    renderAt(<AppRoutes />, '/login');
    await screen.findByLabelText('Email');

    await fillAndSubmit();

    const button = await screen.findByRole('button', { name: /signing in/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByLabelText('Email')).toBeDisabled();
    release();
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('returns to the page the visitor was heading for inside the app', async () => {
    stubFetch(loginOk);
    renderAt(<AppRoutes />, { pathname: '/login', state: { from: '/app/employees' } });
    await screen.findByLabelText('Email');

    await fillAndSubmit();

    expect(await screen.findByRole('heading', { name: 'Employees' })).toBeInTheDocument();
  });

  it('ignores a redirect target that leaves the app', async () => {
    stubFetch(loginOk);
    renderAt(<AppRoutes />, { pathname: '/login', state: { from: '//elsewhere.example/path' } });
    await screen.findByLabelText('Email');

    await fillAndSubmit();

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('sends a signed-in user away from /login to /app', async () => {
    window.localStorage.setItem(TOKEN_KEY, 'valid.token.value');
    stubFetch(() => apiSuccess(user));

    renderAt(<AppRoutes />, '/login');

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('tells a visitor whose session expired', async () => {
    window.localStorage.setItem(TOKEN_KEY, 'expired.token.value');
    stubFetch(() => apiError(401, 'UNAUTHORIZED', 'Invalid or expired token'));

    renderAt(<AppRoutes />, '/login');

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(/your session expired/i),
    );
  });
});
