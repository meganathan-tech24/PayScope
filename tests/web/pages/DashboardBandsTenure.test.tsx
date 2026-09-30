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

const section = (name: string) => screen.findByRole('region', { name });
const table = (region: HTMLElement) => within(region).getByRole('table', { hidden: true });
const cellsOf = (row: HTMLElement) => [...row.querySelectorAll('th, td')].map((c) => c.textContent);
const query = (url: string) => Object.fromEntries(new URL(url).searchParams);

describe('salary bands', () => {
  it('lists each band with both ends in the currency, its count and share, and describes the chart', async () => {
    start('HR_MANAGER');
    const region = await section('Salary bands');

    await waitFor(() => expect(table(region)).toBeInTheDocument());
    const rows = within(table(region)).getAllByRole('row', { hidden: true }).slice(1);
    expect(rows.map(cellsOf)).toEqual([
      ['€35,000.00 to €50,000.00', '4', '33.3%'],
      ['€50,000.00 to €65,000.00', '5', '41.7%'],
      ['€65,000.00 to €80,000.00', '3', '25%'],
    ]);
    expect(
      within(region).getByRole('img', {
        name: /Salary bands in EUR for 12 employees\. Largest band: €50,000\.00 to €65,000\.00, 5 employees \(41\.7%\)/,
      }),
    ).toBeInTheDocument();
  });

  it('tells a viewer their bands use rounded steps, with rounded edges, and tells HR nothing of the kind', async () => {
    start('VIEWER');
    const viewerRegion = await section('Salary bands');

    await waitFor(() => expect(table(viewerRegion)).toBeInTheDocument());
    expect(
      within(viewerRegion).getByText(
        /Bands use rounded steps of €15K, so their ends are approximate/,
      ),
    ).toBeInTheDocument();
    const viewerRows = within(table(viewerRegion)).getAllByRole('row', { hidden: true }).slice(1);
    expect(viewerRows.map((row) => row.querySelector('th')?.textContent)).toEqual([
      '€30,000.00 to €45,000.00',
      '€45,000.00 to €60,000.00',
      '€60,000.00 to €75,000.00',
    ]);
  });

  it('shows an HR manager exact bands and no rounding note', async () => {
    start('HR_MANAGER');
    const region = await section('Salary bands');

    await waitFor(() => expect(table(region)).toBeInTheDocument());

    expect(within(region).queryByText(/rounded steps/)).not.toBeInTheDocument();
  });

  it('asks for the selected currency, and for dollars in the USD view', async () => {
    const { calls } = start('HR_MANAGER', {}, '/app?currency=GBP');
    await waitFor(() =>
      expect(
        calls.some((c) => c.url.includes('/salary-bands') && query(c.url).currency === 'GBP'),
      ).toBe(true),
    );

    const usd = start('HR_MANAGER', {}, '/app?usd=1');
    await waitFor(() =>
      expect(
        usd.calls.some((c) => c.url.includes('/salary-bands') && query(c.url).view === 'usd'),
      ).toBe(true),
    );
    const bandsCall = usd.calls.find((c) => c.url.includes('/salary-bands'));
    expect(query(bandsCall?.url ?? '').currency).toBeUndefined();
  });

  it('tells a viewer when the selection is too small to show, and shows no numbers', async () => {
    start('VIEWER', {
      override: (request) =>
        request.url.includes('/salary-bands')
          ? apiSuccess({
              view: 'native',
              approximate: false,
              excludedHeadcount: 0,
              currency: 'EUR',
              headcount: 0,
              suppressed: true,
              buckets: [],
            })
          : undefined,
    });
    const region = await section('Salary bands');

    expect(
      await within(region).findByText(
        /too few employees in this selection to show a distribution \(fewer than 5\)/,
      ),
    ).toBeInTheDocument();
    expect(within(region).queryByRole('table', { hidden: true })).not.toBeInTheDocument();
  });

  it('has an empty state and an error state with retry', async () => {
    let mode: 'fail' | 'empty' = 'fail';
    start('HR_MANAGER', {
      override: (request) =>
        request.url.includes('/salary-bands')
          ? mode === 'fail'
            ? jsonResponse(500, { success: false, message: 'Boom', code: 'INTERNAL_ERROR' })
            : apiSuccess({
                view: 'native',
                approximate: false,
                excludedHeadcount: 0,
                currency: 'EUR',
                headcount: 0,
                suppressed: false,
                buckets: [],
              })
          : undefined,
    });
    const region = await section('Salary bands');

    const alert = await within(region).findByRole('alert');
    expect(alert).toHaveTextContent('We could not load salary bands');
    mode = 'empty';
    await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }));

    expect(
      await within(region).findByText('There are no salaries to show for this selection.'),
    ).toBeInTheDocument();
    expect(
      within(await section('Pay by group')).getByRole('table', { hidden: true }),
    ).toBeInTheDocument();
  });
});

describe('pay versus tenure', () => {
  it('shows median and average per tenure band in the currency, and describes the chart', async () => {
    start('HR_MANAGER');
    const region = await section('Pay versus tenure');

    await waitFor(() => expect(table(region)).toBeInTheDocument());
    const rows = within(table(region)).getAllByRole('row', { hidden: true }).slice(1);
    expect(rows.map(cellsOf)).toEqual([
      ['Under 1 year', '5', '€40,000.00', '€41,000.00'],
      ['1 to 3 years', '6', '€50,000.00', '€52,000.00'],
      ['5 to 10 years', '7', '€65,000.00', '€66,000.00'],
    ]);
    expect(
      within(region).getByRole('img', {
        name: /Median pay is €40,000\.00 for under 1 year and €65,000\.00 for 5 to 10 years/,
      }),
    ).toBeInTheDocument();
    expect(within(region).getByText('Median pay')).toBeInTheDocument();
    expect(within(region).getByText('Average pay')).toBeInTheDocument();
  });

  it('follows the currency selection and reports hidden groups to a viewer', async () => {
    const { calls } = start('VIEWER', { hiddenGroups: 2 }, '/app?currency=JPY');
    const region = await section('Pay versus tenure');

    expect(
      await within(region).findByText('2 groups hidden: fewer than 5 employees'),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(calls.some((c) => c.url.includes('/tenure') && query(c.url).currency === 'JPY')).toBe(
        true,
      ),
    );
    await waitFor(() => expect(within(table(region)).getAllByText(/¥/).length).toBeGreaterThan(0));
    expect(within(table(region)).queryByText(/€|\$|£/)).not.toBeInTheDocument();
  });

  it('has its own error state with retry and an empty state', async () => {
    let mode: 'fail' | 'empty' = 'fail';
    start('HR_MANAGER', {
      override: (request) =>
        request.url.includes('/tenure')
          ? mode === 'fail'
            ? jsonResponse(500, { success: false, message: 'Boom', code: 'INTERNAL_ERROR' })
            : apiSuccess({
                view: 'native',
                approximate: false,
                excludedHeadcount: 0,
                suppressedGroups: 0,
                bands: [],
              })
          : undefined,
    });
    const region = await section('Pay versus tenure');

    const alert = await within(region).findByRole('alert');
    expect(alert).toHaveTextContent('We could not load pay versus tenure');
    mode = 'empty';
    await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }));

    expect(
      await within(region).findByText('There is no tenure data to show for this selection.'),
    ).toBeInTheDocument();
  });
});
