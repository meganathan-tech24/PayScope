import { screen } from '@testing-library/react';
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

const registered = (role: 'HR_MANAGER' | 'VIEWER') => () =>
  apiSuccess(
    {
      user: { id: 'u1', name: 'Ada Lovelace', email: 'ada@example.com', role },
      token: 'new.token.value',
    },
    201,
  );

async function open() {
  renderAt(<AppRoutes />, '/register');
  await screen.findByRole('heading', { level: 1, name: 'Create your account' });
}

async function fill({
  name = 'Ada Lovelace',
  email = 'ada@example.com',
  password = 'Passw0rd!',
} = {}) {
  if (name) await userEvent.type(screen.getByLabelText('Full name'), name);
  if (email) await userEvent.type(screen.getByLabelText('Email'), email);
  if (password) await userEvent.type(screen.getByLabelText('Password'), password);
}

const submit = () => userEvent.click(screen.getByRole('button', { name: 'Create account' }));

describe('register page', () => {
  it('explains both account types, with Viewer selected by default', async () => {
    stubFetch(() => apiSuccess({}));

    await open();

    expect(screen.getByRole('group', { name: 'Account type' })).toBeInTheDocument();
    const viewer = screen.getByRole('radio', { name: /Viewer/ });
    const hr = screen.getByRole('radio', { name: /HR Manager/ });
    expect(viewer).toBeChecked();
    expect(hr).not.toBeChecked();
    expect(viewer).toHaveAccessibleDescription(/individual salaries are never shown/i);
    expect(hr).toHaveAccessibleDescription(/every pay figure, including individual salaries/i);
    expect(screen.getByText(/for this demonstration/i)).toBeInTheDocument();
  });

  it('creates a Viewer by default, signs in, and lands on /app', async () => {
    const { calls } = stubFetch(registered('VIEWER'));
    await open();

    await fill({ name: '  Ada Lovelace ', email: ' Ada@Example.com' });
    await submit();

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(calls[0]?.url).toMatch(/\/auth\/register$/);
    expect(calls[0]?.json).toEqual({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'Passw0rd!',
      role: 'VIEWER',
    });
    expect(window.localStorage.getItem(TOKEN_KEY)).toBe('new.token.value');
  });

  it('creates an HR Manager when that account type is chosen', async () => {
    const { calls } = stubFetch(registered('HR_MANAGER'));
    await open();

    await userEvent.click(screen.getByRole('radio', { name: /HR Manager/ }));
    await fill();
    await submit();

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(calls[0]?.json).toMatchObject({ role: 'HR_MANAGER' });
  });

  it('shows the password rules and inline errors for an empty form, without calling the server', async () => {
    const { calls } = stubFetch(() => apiSuccess({}));
    await open();

    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription(/at least 8 characters/i);
    await submit();

    expect(screen.getByLabelText('Full name')).toHaveAccessibleDescription('Name is required');
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Invalid email address');
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription(
      /Password must be at least 8 characters/,
    );
    expect(screen.getByLabelText('Full name')).toHaveFocus();
    expect(calls).toHaveLength(0);
  });

  it.each([
    [
      'a password without an uppercase letter',
      'passw0rd!',
      'Password must contain an uppercase letter',
    ],
    ['a password without a number', 'Password!', 'Password must contain a number'],
    [
      'a password without a lowercase letter',
      'PASSW0RD!',
      'Password must contain a lowercase letter',
    ],
  ])('rejects %s', async (_label, password, message) => {
    const { calls } = stubFetch(() => apiSuccess({}));
    await open();

    await fill({ password });
    await submit();

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it('shows an inline error on the email for a duplicate account (409), and clears it on edit', async () => {
    stubFetch(() => apiError(409, 'EMAIL_TAKEN', 'An account with this email already exists'));
    await open();

    await fill();
    await submit();

    const email = screen.getByLabelText('Email');
    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument();

    await userEvent.type(email, 'x');

    expect(screen.queryByText(/already exists/i)).not.toBeInTheDocument();
  });

  it('shows a rate limit message for 429', async () => {
    stubFetch(() => apiError(429, 'RATE_LIMITED', 'Too many requests, please try again later'));
    await open();

    await fill();
    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent(/too many attempts/i);
  });

  it('says so when the server cannot be reached', async () => {
    stubFetchNetworkFailure();
    await open();

    await fill();
    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not reach the server/i);
  });

  it('disables the form and shows progress while the account is created', async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => (release = resolve));
    stubFetch(async () => {
      await gate;
      return registered('VIEWER')();
    });
    await open();

    await fill();
    await submit();

    const button = await screen.findByRole('button', { name: /creating account/i });
    expect(button).toBeDisabled();
    expect(screen.getByLabelText('Email')).toBeDisabled();
    expect(screen.getByRole('radio', { name: /Viewer/ })).toBeDisabled();
    release();
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('sends a signed-in user away from /register to /app', async () => {
    window.localStorage.setItem(TOKEN_KEY, 'valid.token.value');
    stubFetch(() =>
      apiSuccess({ id: 'u1', name: 'Ada', email: 'ada@example.com', role: 'VIEWER' }),
    );

    renderAt(<AppRoutes />, '/register');

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('links to the sign-in page', async () => {
    stubFetch(() => apiSuccess({}));
    await open();

    // The header link and the one under the form both go to the sign-in page.
    for (const link of screen.getAllByRole('link', { name: 'Sign in' })) {
      expect(link).toHaveAttribute('href', '/login');
    }
  });
});
