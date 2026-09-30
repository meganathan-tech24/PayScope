import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { employeeJson, listPage, stubAppApi } from '@tests/helpers/app-api.js';
import { renderAt } from '@tests/helpers/render.js';
import { AppRoutes } from '@web/app/router/routes';
import { TOKEN_KEY } from '@web/features/auth/services/token-storage';

function start(path = '/app/employees') {
  window.localStorage.setItem(TOKEN_KEY, 'valid.token.value');
  stubAppApi({ role: 'HR_MANAGER', list: () => listPage([employeeJson()]) });
  renderAt(<AppRoutes />, path);
}

const toggle = () => screen.findByRole('button', { name: /^Filters and sort/ });

// jsdom applies no Tailwind, so "hidden on a phone" is asserted through the `hidden` class
// that the responsive styles turn into display:none below md (and undo from md up).
async function panel() {
  const button = await toggle();
  return document.getElementById(button.getAttribute('aria-controls') ?? '') as HTMLElement;
}

describe('collapsible filter panel', () => {
  it('starts collapsed, with the search box still visible outside the panel', async () => {
    start();
    const button = await toggle();

    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(await panel()).toHaveClass('hidden');
    expect(screen.getByLabelText('Search by name or email')).toBeVisible();
    expect(await panel()).not.toContainElement(screen.getByLabelText('Search by name or email'));
  });

  it('opens and closes with the button, and the button controls the panel that holds the filters and sort', async () => {
    start();
    const button = await toggle();

    await userEvent.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
    const filters = await panel();
    expect(filters).not.toHaveClass('hidden');
    for (const label of ['Country', 'Department', 'Job title', 'Sort by', 'Order']) {
      expect(within(filters).getByLabelText(label)).toBeInTheDocument();
    }
    expect(within(filters).getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();

    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(filters).toHaveClass('hidden');
  });

  it('shows the number of active filters on the button and updates it as filters change', async () => {
    start();
    const button = await toggle();
    expect(button).toHaveAccessibleName('Filters and sort');
    await userEvent.click(button);
    await screen.findByRole('option', { name: 'Germany' });

    await userEvent.selectOptions(screen.getByLabelText('Country'), 'DE');
    expect(button).toHaveAccessibleName('Filters and sort, 1 active');

    await userEvent.selectOptions(screen.getByLabelText('Department'), 'Finance');
    expect(button).toHaveAccessibleName('Filters and sort, 2 active');
    expect(within(button).getByText('2')).toBeInTheDocument();

    await userEvent.click(within(await panel()).getByRole('button', { name: 'Clear filters' }));
    await waitFor(() => expect(button).toHaveAccessibleName('Filters and sort'));
  });

  it('counts filters that come from the URL even while the panel is closed', async () => {
    start('/app/employees?country=DE&jobTitle=Analyst&department=Finance');

    const button = await toggle();

    expect(button).toHaveAccessibleName('Filters and sort, 3 active');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('does not count the search text (it is visible) and keeps the sort out of the count', async () => {
    start('/app/employees?search=ada&sortBy=hireDate');

    expect(await toggle()).toHaveAccessibleName('Filters and sort');
    expect(screen.getByLabelText('Search by name or email')).toHaveValue('ada');
  });
});
