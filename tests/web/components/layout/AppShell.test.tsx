import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { stubAppApi } from '@tests/helpers/app-api.js';
import { renderAt } from '@tests/helpers/render.js';
import { AppRoutes } from '@web/app/router/routes';
import { TOKEN_KEY } from '@web/features/auth/services/token-storage';

function signIn(role: 'HR_MANAGER' | 'VIEWER') {
  window.localStorage.setItem(TOKEN_KEY, 'valid.token.value');
  stubAppApi({ role });
}

describe('AppShell', () => {
  it('has one navigation with Dashboard, Employees, the user, their role and Log out', async () => {
    signIn('HR_MANAGER');
    renderAt(<AppRoutes />, '/app');
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' });

    const nav = within(screen.getByRole('navigation', { name: 'app menu', hidden: true }));
    expect(nav.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
    expect(nav.getByRole('link', { name: 'Employees' })).toHaveAttribute('href', '/app/employees');
    expect(nav.getByText('HR Manager')).toBeInTheDocument();
    expect(nav.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  });

  it('opens and closes the menu drawer with its button and Escape', async () => {
    signIn('VIEWER');
    renderAt(<AppRoutes />, '/app');
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' });

    const button = screen.getByRole('button', { name: 'Open app menu' });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(button);
    expect(screen.getByRole('button', { name: 'Close app menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Open app menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('closes the drawer after a link is chosen', async () => {
    signIn('HR_MANAGER');
    renderAt(<AppRoutes />, '/app');
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' });

    await userEvent.click(screen.getByRole('button', { name: 'Open app menu' }));
    await userEvent.click(screen.getByRole('link', { name: 'Employees' }));

    expect(screen.getByRole('button', { name: 'Open app menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
