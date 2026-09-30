import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { employeeJson, listPage, stubAppApi, type TestRole } from '@tests/helpers/app-api.js';
import { renderAt } from '@tests/helpers/render.js';
import { AppRoutes } from '@web/app/router/routes';
import { TOKEN_KEY } from '@web/features/auth/services/token-storage';

function start(role: TestRole) {
  window.localStorage.setItem(TOKEN_KEY, 'valid.token.value');
  stubAppApi({
    role,
    list: () =>
      listPage([
        employeeJson({
          fullName: 'Grace Hopper',
          email: 'grace@example.com',
          salary: 7_800_000,
          currency: 'GBP',
          employmentType: 'INTERN',
        }),
      ]),
  });
  renderAt(<AppRoutes />, '/app/employees');
}

describe('employee list, action colours and row content', () => {
  it('shows Edit as a soft blue icon button and Delete as a soft red one, each named for the person', async () => {
    start('HR_MANAGER');

    const [edit] = await screen.findAllByRole('button', { name: 'Edit Grace Hopper' });
    const [remove] = await screen.findAllByRole('button', { name: 'Delete Grace Hopper' });
    expect(edit).toHaveClass('bg-edit-soft', 'text-edit-text');
    expect(edit).toHaveAttribute('title', 'Edit Grace Hopper');
    expect(remove).toHaveClass('bg-remove-soft', 'text-remove-text');
    expect(remove).toHaveAttribute('title', 'Delete Grace Hopper');
  });

  it('shows Add employee as the solid brand action and Export CSV as a teal outline with an icon', async () => {
    start('HR_MANAGER');

    const add = await screen.findByRole('button', { name: 'Add employee' });
    expect(add).toHaveClass('bg-brand-600');
    const exportButton = screen.getByRole('button', { name: 'Export CSV' });
    expect(exportButton).toHaveClass('border-download', 'text-download');
    expect(exportButton.querySelector('svg')).not.toBeNull();
  });

  it('shows the type as a badge, initials in an avatar, and the salary with its currency code', async () => {
    start('HR_MANAGER');

    const table = await screen.findByRole('table', { name: 'Employees' });
    const row = within(within(table).getByText('Grace Hopper').closest('tr') as HTMLElement);
    expect(row.getByText('Intern')).toHaveClass('badge');
    expect(row.getByText('GH')).toBeInTheDocument();
    expect(row.getByText('£78,000.00')).toHaveClass('num');
    expect(row.getByText('GBP')).toBeInTheDocument();
  });

  it('gives a viewer the same rows with no salary, currency code or action buttons', async () => {
    start('VIEWER');

    const table = await screen.findByRole('table', { name: 'Employees' });
    expect(within(table).getByText('Grace Hopper')).toBeInTheDocument();
    expect(within(table).queryByText('GBP')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^(Edit|Delete) / })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add employee' })).not.toBeInTheDocument();
  });

  it('opens the delete dialog with Cancel focused and a solid red Delete employee button', async () => {
    start('HR_MANAGER');

    const [remove] = await screen.findAllByRole('button', { name: 'Delete Grace Hopper' });
    await userEvent.click(remove as HTMLElement);

    const dialog = await screen.findByRole('dialog', { name: 'Delete employee' });
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    expect(within(dialog).getByRole('button', { name: 'Delete employee' })).toHaveClass(
      'bg-remove',
      'text-white',
    );
  });
});
