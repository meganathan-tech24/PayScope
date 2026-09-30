import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { stubAppApi, type TestRole } from '@tests/helpers/app-api.js';
import { apiSuccess, jsonResponse } from '@tests/helpers/fetch-mock.js';
import { insightsApi, type InsightsFixtureOptions } from '@tests/helpers/insights-fixtures.js';
import { renderAt } from '@tests/helpers/render.js';
import { AppRoutes } from '@web/app/router/routes';
import { TOKEN_KEY } from '@web/features/auth/services/token-storage';

function start(
  role: TestRole,
  options: Partial<Omit<InsightsFixtureOptions, 'role'>> = {},
  path = '/app',
) {
  window.localStorage.setItem(TOKEN_KEY, 'valid.token.value');
  const api = stubAppApi({ role, other: insightsApi({ role, ...options }) });
  renderAt(<AppRoutes />, path);
  return api;
}

const query = (url: string) => Object.fromEntries(new URL(url).searchParams);

describe('outliers, HR managers only', () => {
  it('lists each outlier with employment type, own-currency amounts and a worded direction', async () => {
    start('HR_MANAGER');
    const region = await screen.findByRole('region', { name: 'Outliers' });

    const table = await within(region).findByRole('table', { name: 'Outliers', hidden: true });
    const high = within(table).getByRole('row', { name: /Outlier High/, hidden: true });
    const low = within(table).getByRole('row', { name: /Outlier Low/, hidden: true });

    expect([...high.querySelectorAll('th, td')].map((c) => c.textContent)).toEqual([
      'Outlier High',
      'Engineer',
      'Germany',
      'Contract',
      '€120,000.00',
      '€60,000.00',
      '+100% above the group median',
      '9',
    ]);
    expect(within(low).getByText(/−60%/)).toBeInTheDocument();
    expect(within(low).getByText('below the group median')).toBeInTheDocument();
    expect(within(low).getByText('Full time')).toBeInTheDocument();
    expect(within(region).getByRole('status')).toHaveTextContent(
      'Showing 2 of 3, largest difference first.',
    );
  });

  it('shows the difference as a warning pill with an arrow icon, and a distance bar that is hidden from assistive technology', async () => {
    start('HR_MANAGER');
    const region = await screen.findByRole('region', { name: 'Outliers' });
    const table = await within(region).findByRole('table', { name: 'Outliers', hidden: true });
    const low = within(table).getByRole('row', { name: /Outlier Low/, hidden: true });

    const pill = within(low).getByText(/−60%/);
    expect(pill).toHaveClass('bg-warning-light', 'text-warning');
    expect(pill.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    const bar = pill.parentElement?.querySelector('[aria-hidden="true"].rounded-full');
    expect(bar).not.toBeNull();
  });

  it('offers the same people as cards for small screens', async () => {
    start('HR_MANAGER');
    const region = await screen.findByRole('region', { name: 'Outliers' });

    const cards = await within(region).findByRole('list', { name: 'Outliers', hidden: true });

    expect(within(cards).getByText('Outlier High')).toBeInTheDocument();
    expect(within(cards).getByText('€120,000.00')).toBeInTheDocument();
    expect(within(cards).getByText(/Engineer · Germany · Contract/)).toBeInTheDocument();
  });

  it('asks for the selected currency, and for every currency in the USD view', async () => {
    const eur = start('HR_MANAGER');
    await waitFor(() =>
      expect(
        eur.calls.some((c) => c.url.includes('/outliers') && query(c.url).currency === 'EUR'),
      ).toBe(true),
    );
    expect(await screen.findByText(/Showing people paid in EUR/)).toBeInTheDocument();
  });

  it('is not converted in the USD view and says so', async () => {
    const { calls } = start('HR_MANAGER', {}, '/app?usd=1');

    expect(
      await screen.findByText(/not converted, so it covers every currency/),
    ).toBeInTheDocument();
    await waitFor(() => expect(calls.some((c) => c.url.includes('/outliers'))).toBe(true));
    expect(
      query(calls.find((c) => c.url.includes('/outliers'))?.url ?? '').currency,
    ).toBeUndefined();
  });

  it('does not exist for a viewer: no section, no request, no link', async () => {
    const { calls } = start('VIEWER');
    await screen.findByRole('region', { name: 'Pay by group' });

    expect(screen.queryByRole('region', { name: 'Outliers' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Outliers' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /outlier/i })).not.toBeInTheDocument();
    expect(calls.some((c) => c.url.includes('/outliers'))).toBe(false);
  });

  it('has no outliers link in the navigation for an HR manager either (it is a dashboard section)', async () => {
    start('HR_MANAGER');
    await screen.findByRole('region', { name: 'Outliers' });

    expect(screen.queryByRole('link', { name: /outlier/i })).not.toBeInTheDocument();
  });

  it('has an empty state and an error with retry, contained to its section', async () => {
    let mode: 'fail' | 'empty' = 'fail';
    start('HR_MANAGER', {
      override: (request) =>
        request.url.includes('/insights/outliers')
          ? mode === 'fail'
            ? jsonResponse(500, { success: false, message: 'Boom', code: 'INTERNAL_ERROR' })
            : apiSuccess({ total: 0, rows: [] })
          : undefined,
    });
    const region = await screen.findByRole('region', { name: 'Outliers' });

    const alert = await within(region).findByRole('alert');
    expect(alert).toHaveTextContent('We could not load outliers');
    expect(await screen.findByRole('region', { name: 'Headcount' })).toBeInTheDocument();
    mode = 'empty';
    await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }));

    expect(
      await within(region).findByText('No outliers found for this selection.'),
    ).toBeInTheDocument();
  });
});
