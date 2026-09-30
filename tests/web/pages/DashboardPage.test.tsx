import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';

import { stubAppApi, type TestRole } from '@tests/helpers/app-api.js';
import { apiError, jsonResponse } from '@tests/helpers/fetch-mock.js';
import { insightsApi, type InsightsFixtureOptions } from '@tests/helpers/insights-fixtures.js';
import { renderAt } from '@tests/helpers/render.js';
import { AppRoutes } from '@web/app/router/routes';
import { TOKEN_KEY } from '@web/features/auth/services/token-storage';

function Location() {
  const location = useLocation();
  return <p data-testid="location">{`${location.pathname}${location.search}`}</p>;
}

function start(
  role: TestRole,
  options: Partial<Omit<InsightsFixtureOptions, 'role'>> = {},
  path = '/app',
) {
  window.localStorage.setItem(TOKEN_KEY, 'valid.token.value');
  const api = stubAppApi({ role, other: insightsApi({ role, ...options }) });
  renderAt(
    <>
      <AppRoutes />
      <Location />
    </>,
    path,
  );
  return api;
}

const requests = (calls: { url: string }[], part: string) =>
  calls
    .filter((c) => c.url.includes(part))
    .map((c) => Object.fromEntries(new URL(c.url).searchParams));

// The summary cards are a <dl>; find it through its first term.
const cards = async () => {
  const [term] = await screen.findAllByRole('term');
  return within(term?.closest('dl') as HTMLElement);
};

describe('dashboard summary, currency and USD view', () => {
  it('opens on the most-used currency and shows amounts only in that currency', async () => {
    start('HR_MANAGER');

    const currency = await screen.findByLabelText('Currency');
    await waitFor(() => expect(currency).toHaveValue('EUR'));
    const summary = await cards();

    expect(summary.getByText('€60,000.00')).toBeInTheDocument(); // Germany, highest EUR median
    expect(summary.getByText('€55,000.00')).toBeInTheDocument(); // France, lowest EUR median
    expect(summary.getByText('35')).toBeInTheDocument(); // employees: a count
    expect(summary.getByText('across 5 countries')).toBeInTheDocument();
    expect(screen.queryByText(/£|¥|\$/, { selector: 'dd' })).not.toBeInTheDocument();
  });

  it('lists the currencies present, named, and switches everything to the chosen one', async () => {
    start('HR_MANAGER');
    const currency = await screen.findByLabelText('Currency');
    await waitFor(() => expect(currency).toHaveValue('EUR'));

    expect(
      within(currency)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['EUR – Euro', 'USD – US Dollar', 'GBP – British Pound', 'JPY – Japanese Yen']);
    await userEvent.selectOptions(currency, 'JPY');

    const summary = await cards();
    await waitFor(() => expect(summary.getByText('¥7,000,000')).toBeInTheDocument()); // whole yen: no minor unit
    expect(summary.getByText('Median pay')).toBeInTheDocument(); // one country in JPY
    expect(summary.queryByText('Lowest median pay')).not.toBeInTheDocument();
    expect(summary.queryByText(/€/)).not.toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('currency=JPY');
  });

  it('keeps the USD view off by default, clearly labelled, and explains what it does', async () => {
    const { calls } = start('HR_MANAGER');

    const usdSwitch = await screen.findByRole('switch', { name: 'Show approximate USD view' });

    expect(usdSwitch).not.toBeChecked();
    expect(usdSwitch).toHaveAccessibleDescription(/fixed sample rates.*Off by default/);
    expect(screen.queryByText(/^Approximate\./)).not.toBeInTheDocument();
    expect(requests(calls, '/insights/stats').every((q) => q.view === undefined)).toBe(true);
  });

  it('turns on the USD view: approximate label, dollars, view=usd, currency selector disabled, excluded note', async () => {
    const { calls } = start('HR_MANAGER');
    const usdSwitch = await screen.findByRole('switch', { name: 'Show approximate USD view' });

    await userEvent.click(usdSwitch);

    expect(
      await screen.findByText(/converted at fixed sample exchange rates/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/2 employees have no exchange rate and are left out/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Currency')).toBeDisabled();
    const summary = await cards();
    await waitFor(() => expect(summary.getAllByText(/^\$/).length).toBeGreaterThan(0));
    expect(requests(calls, '/insights/stats').some((q) => q.view === 'usd')).toBe(true);
    expect(screen.getByTestId('location')).toHaveTextContent('usd=1');

    await userEvent.click(usdSwitch);
    expect(screen.getByLabelText('Currency')).toBeEnabled();
    expect(screen.queryByText(/converted at fixed sample exchange rates/i)).not.toBeInTheDocument();
  });

  it('restores currency and USD state from the URL', async () => {
    start('HR_MANAGER', {}, '/app?currency=GBP');

    await waitFor(() => expect(screen.getByLabelText('Currency')).toHaveValue('GBP'));
    expect((await cards()).getByText('£50,000.00')).toBeInTheDocument();
  });

  it('falls back to the most-used currency when the URL asks for one that is not there', async () => {
    start('HR_MANAGER', {}, '/app?currency=CHF');

    await waitFor(() => expect(screen.getByLabelText('Currency')).toHaveValue('EUR'));
  });
});

describe('dashboard by role', () => {
  it('tells a viewer what they are looking at, and hides HR-only content', async () => {
    const { calls } = start('VIEWER');

    expect(
      await screen.findByText(
        /aggregated statistics\. Individual salaries, minimum and maximum pay and outliers/i,
      ),
    ).toBeInTheDocument();
    await cards();
    expect(screen.queryByText('Outliers flagged')).not.toBeInTheDocument();
    expect(calls.some((c) => c.url.includes('/insights/outliers'))).toBe(false);
  });

  it('gives an HR manager the outliers count, asked for in the selected currency', async () => {
    const { calls } = start('HR_MANAGER');

    const summary = await cards();

    expect(await summary.findByText('Outliers flagged')).toBeInTheDocument();
    expect(summary.getByText('3')).toBeInTheDocument();
    await waitFor(() => expect(requests(calls, '/insights/outliers').at(-1)?.currency).toBe('EUR'));
  });

  it('says how many groups were hidden from a viewer, with singular and plural', async () => {
    start('VIEWER', { hiddenGroups: 3 });
    expect(await screen.findByText('3 groups hidden: fewer than 5 employees')).toBeInTheDocument();
  });

  it('uses the singular for one hidden group and shows nothing for none', async () => {
    const { unmount } = (() => {
      start('VIEWER', { hiddenGroups: 1 });
      return { unmount: () => undefined };
    })();
    expect(await screen.findByText('1 group hidden: fewer than 5 employees')).toBeInTheDocument();
    unmount();
  });

  it('shows no hidden-groups note when nothing was hidden', async () => {
    start('VIEWER', { hiddenGroups: 0 });
    await cards();

    expect(screen.queryByText(/hidden: fewer than/)).not.toBeInTheDocument();
  });
});

describe('dashboard states', () => {
  it('shows a skeleton first, then the content', async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => (release = resolve));
    start('HR_MANAGER', {
      override: async (request) => {
        if (request.url.includes('/insights/stats')) await gate;
        return undefined;
      },
    });

    expect(await screen.findByRole('status', { name: 'Loading pay insights' })).toBeInTheDocument();
    release();
    await screen.findByLabelText('Currency');
    expect(screen.queryByRole('status', { name: 'Loading pay insights' })).not.toBeInTheDocument();
  });

  it('shows an error with a retry that recovers', async () => {
    let fail = true;
    start('HR_MANAGER', {
      override: (request) =>
        fail && request.url.includes('/insights/stats')
          ? jsonResponse(500, { success: false, message: 'Boom', code: 'INTERNAL_ERROR' })
          : undefined,
    });

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('We could not load the pay insights');
    fail = false;
    await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }));

    expect(await screen.findByLabelText('Currency')).toBeInTheDocument();
  });

  it('explains an organisation with no pay data', async () => {
    start('HR_MANAGER', {
      override: (request) =>
        request.url.includes('/insights/stats')
          ? jsonResponse(200, {
              success: true,
              data: {
                view: 'native',
                approximate: false,
                excludedHeadcount: 0,
                suppressedGroups: 0,
                rows: [],
              },
              meta: { requestId: 'r' },
            })
          : undefined,
    });

    expect(await screen.findByRole('heading', { name: 'No pay data yet' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Currency')).not.toBeInTheDocument();
  });

  it('reports a rejected request as an error too', async () => {
    start('VIEWER', {
      override: (request) =>
        request.url.includes('/insights/stats')
          ? apiError(403, 'FORBIDDEN', 'Insufficient permissions')
          : undefined,
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load/i);
  });
});
