import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { stubAppApi } from '@tests/helpers/app-api.js';
import { apiSuccess, stubFetch } from '@tests/helpers/fetch-mock.js';
import { renderAt } from '@tests/helpers/render.js';
import { AppRoutes } from '@web/app/router/routes';
import { TOKEN_KEY } from '@web/features/auth/services/token-storage';

function signedInAs(role: 'HR_MANAGER' | 'VIEWER') {
  window.localStorage.setItem(TOKEN_KEY, 'valid.token.value');
  stubAppApi({ role });
}

describe('AppRoutes, public pages', () => {
  it('serves the landing page at /', async () => {
    stubFetch(() => apiSuccess({}));

    renderAt(<AppRoutes />, '/');

    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('shows the 404 page for an unknown address, with a way home', async () => {
    stubFetch(() => apiSuccess({}));

    renderAt(<AppRoutes />, '/no/such/page');

    expect(
      await screen.findByRole('heading', { name: /could not find that page/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /home page/i })).toHaveAttribute('href', '/');
  });

  it('shows the 403 page at /403', async () => {
    stubFetch(() => apiSuccess({}));

    renderAt(<AppRoutes />, '/403');

    expect(await screen.findByRole('heading', { name: /do not have access/i })).toBeInTheDocument();
  });

  it('offers Sign in and Create account in the header to a visitor, and Open app to a signed-in user', async () => {
    stubFetch(() => apiSuccess({}));
    const { unmount } = renderAt(<AppRoutes />, '/');
    const header = () => within(screen.getByRole('banner', { hidden: true }));
    expect(await header().findByRole('link', { name: 'Sign in', hidden: true })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(header().getByRole('link', { name: 'Create account', hidden: true })).toHaveAttribute(
      'href',
      '/register',
    );
    unmount();

    signedInAs('VIEWER');
    renderAt(<AppRoutes />, '/');

    expect(await header().findByRole('link', { name: 'Open app', hidden: true })).toHaveAttribute(
      'href',
      '/app',
    );
    expect(header().queryByRole('link', { name: 'Sign in', hidden: true })).not.toBeInTheDocument();
  });
});

describe('AppRoutes, signed-in area', () => {
  it('sends a signed-out visitor from /app to the login page', async () => {
    stubFetch(() => apiSuccess({}));

    renderAt(<AppRoutes />, '/app');

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it.each([
    ['HR_MANAGER', 'HR Manager'],
    ['VIEWER', 'Viewer'],
  ] as const)(
    'shows a %s the dashboard, with their name and role in the header',
    async (role, label) => {
      signedInAs(role);

      renderAt(<AppRoutes />, '/app');

      expect(
        await screen.findByRole('heading', { level: 1, name: 'Dashboard' }),
      ).toBeInTheDocument();
      const header = within(screen.getByRole('banner', { hidden: true }));
      expect(header.getByText('Ada Lovelace')).toBeInTheDocument();
      expect(header.getByText(label)).toBeInTheDocument();
    },
  );

  it('serves /app/employees inside the app shell, with navigation and the current page marked', async () => {
    signedInAs('VIEWER');

    renderAt(<AppRoutes />, '/app/employees');

    expect(await screen.findByRole('heading', { name: 'Employees' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Employees' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
  });

  it('has a visible Log out that ends the session and returns to the sign-in page', async () => {
    signedInAs('HR_MANAGER');
    renderAt(<AppRoutes />, '/app');

    await userEvent.click(await screen.findByRole('button', { name: 'Log out' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});
