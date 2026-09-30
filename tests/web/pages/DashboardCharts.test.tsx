import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';

import { stubAppApi, type TestRole } from '@tests/helpers/app-api.js';
import { apiSuccess, jsonResponse } from '@tests/helpers/fetch-mock.js';
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

const section = (name: string) => screen.findByRole('region', { name });
const table = (region: HTMLElement) => within(region).getByRole('table', { hidden: true });
const headers = (t: HTMLElement) =>
  within(t)
    .getAllByRole('columnheader', { hidden: true })
    .map((h) => h.textContent);
const query = (url: string) => Object.fromEntries(new URL(url).searchParams);

describe('pay by group', () => {
  it('gives an HR manager every statistic, sorted by median, in one currency', async () => {
    start('HR_MANAGER');
    const region = await section('Pay by group');

    await waitFor(() => expect(headers(table(region))).toContain('Minimum'));
    expect(headers(table(region))).toEqual([
      'Country',
      'Employees',
      'Minimum',
      '25th percentile',
      'Median',
      'Average',
      '75th percentile',
      'Maximum',
    ]);
    const rows = within(table(region)).getAllByRole('row', { hidden: true }).slice(1);
    expect(
      rows.map((r) => within(r).getAllByRole('cell', { hidden: true })[1]?.textContent),
    ).toEqual(['€40,000.00', '€35,000.00']);
    expect(within(rows[0]!).getByRole('rowheader', { hidden: true })).toHaveTextContent('Germany');
    expect(within(table(region)).queryByText(/£|¥|\$/)).not.toBeInTheDocument();
  });

  it('gives a viewer the same table without minimum and maximum, and no gaps', async () => {
    start('VIEWER');
    const region = await section('Pay by group');

    await waitFor(() => expect(table(region)).toBeInTheDocument());
    const head = headers(table(region));
    expect(head).toEqual([
      'Country',
      'Employees',
      '25th percentile',
      'Median',
      'Average',
      '75th percentile',
    ]);
    for (const row of within(table(region)).getAllByRole('row', { hidden: true }).slice(1)) {
      const cells = [...row.querySelectorAll('th, td')];
      expect(cells).toHaveLength(head.length);
      expect(cells.every((cell) => cell.textContent?.trim())).toBe(true);
    }
    expect(region.textContent).not.toMatch(/Minimum|Maximum/);
  });

  it('describes the chart in words and separates the series by pattern and text', async () => {
    start('HR_MANAGER');
    const region = await section('Pay by group');

    const image = await within(region).findByRole('img', {
      name: /Pay by country in EUR\. Highest median: Germany, €60,000\.00\. Lowest median: France, €55,000\.00\./,
    });
    expect(image).toBeInTheDocument();
    expect(within(region).getByText('25th percentile to median')).toBeInTheDocument();
    expect(within(region).getByText('Median to 75th percentile')).toBeInTheDocument();
  });

  it('regroups by job title and department in the selected currency', async () => {
    const { calls } = start('HR_MANAGER');
    const region = await section('Pay by group');
    await waitFor(() => expect(table(region)).toBeInTheDocument());

    await userEvent.click(within(region).getByRole('radio', { name: 'Job title' }));

    await waitFor(() => expect(headers(table(region))[0]).toBe('Job title'));
    expect(
      within(table(region)).getByRole('rowheader', { hidden: true, name: 'Analyst' }),
    ).toBeInTheDocument();
    const asked = calls.filter((c) => c.url.includes('groupBy=jobTitle')).map((c) => query(c.url));
    expect(asked.at(-1)).toEqual({ groupBy: 'jobTitle', currency: 'EUR' });
    expect(screen.getByTestId('location')).toHaveTextContent('payBy=jobTitle');

    await userEvent.click(within(region).getByRole('radio', { name: 'Department' }));
    await waitFor(() => expect(headers(table(region))[0]).toBe('Department'));
  });

  it('says how many groups a viewer cannot see', async () => {
    start('VIEWER', { hiddenGroups: 3 });
    const region = await section('Pay by group');

    expect(
      await within(region).findByText('3 groups hidden: fewer than 5 employees'),
    ).toBeInTheDocument();
  });

  it('draws the top 15 groups and says the table has the rest', async () => {
    const many = Array.from({ length: 17 }, (_, i) => ({
      key: `Title ${String(i).padStart(2, '0')}`,
      currency: 'EUR',
      headcount: 6,
      min: 1,
      p25: 2,
      median: 10 + i,
      avg: 11,
      p75: 20,
      max: 30,
    }));
    start(
      'HR_MANAGER',
      {
        override: (request) =>
          request.url.includes('groupBy=jobTitle')
            ? apiSuccess({
                view: 'native',
                approximate: false,
                excludedHeadcount: 0,
                suppressedGroups: 0,
                rows: many,
              })
            : undefined,
      },
      '/app?payBy=jobTitle&currency=EUR',
    );
    const region = await section('Pay by group');

    expect(
      await within(region).findByText(/Showing the 15 groups with the highest median, out of 17/),
    ).toBeInTheDocument();
    expect(within(table(region)).getAllByRole('row', { hidden: true })).toHaveLength(18);
  });

  it('labels the USD view as approximate and formats in dollars', async () => {
    start('HR_MANAGER', {}, '/app?usd=1');
    const region = await section('Pay by group');

    await waitFor(() =>
      expect(within(table(region)).getAllByText(/^\$/, { exact: false }).length).toBeGreaterThan(0),
    );
    expect(screen.getByText(/converted at fixed sample exchange rates/i)).toBeInTheDocument();
  });

  it('shows its own skeleton, empty state and error with retry without touching other sections', async () => {
    let mode: 'fail' | 'ok' = 'fail';
    start(
      'HR_MANAGER',
      {
        override: (request) =>
          request.url.includes('groupBy=department')
            ? mode === 'fail'
              ? jsonResponse(500, { success: false, message: 'Boom', code: 'INTERNAL_ERROR' })
              : apiSuccess({
                  view: 'native',
                  approximate: false,
                  excludedHeadcount: 0,
                  suppressedGroups: 0,
                  rows: [],
                })
            : undefined,
      },
      '/app?payBy=department&currency=EUR',
    );
    const region = await section('Pay by group');

    const alert = await within(region).findByRole('alert');
    expect(alert).toHaveTextContent('We could not load pay by group');
    expect(
      within(await section('Headcount')).getByRole('table', { hidden: true }),
    ).toBeInTheDocument();
    mode = 'ok';
    await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }));

    expect(
      await within(region).findByText('There are no groups to show for this selection.'),
    ).toBeInTheDocument();
  });
});

describe('headcount', () => {
  it('counts people by country with names and shares of the total', async () => {
    start('HR_MANAGER');
    const region = await section('Headcount');

    await waitFor(() => expect(table(region)).toBeInTheDocument());
    const row = within(table(region))
      .getByRole('rowheader', { hidden: true, name: 'United States' })
      .closest('tr') as HTMLElement;
    expect(
      within(row)
        .getAllByRole('cell', { hidden: true })
        .map((c) => c.textContent),
    ).toEqual(['10', '28.6%']);
    expect(
      within(region).getByRole('img', {
        name: /35 employees in total\. Largest group: United States, 10 employees \(28\.6%\)/,
      }),
    ).toBeInTheDocument();
  });

  it('switches the dimension, including employment type', async () => {
    const { calls } = start('VIEWER');
    const region = await section('Headcount');
    await waitFor(() => expect(table(region)).toBeInTheDocument());

    await userEvent.click(within(region).getByRole('radio', { name: 'Employment type' }));

    await waitFor(() =>
      expect(
        within(table(region)).getByRole('rowheader', { hidden: true, name: 'Full time' }),
      ).toBeInTheDocument(),
    );
    expect(calls.some((c) => query(c.url).by === 'employmentType')).toBe(true);
    expect(screen.getByTestId('location')).toHaveTextContent('headcountBy=employmentType');
  });

  it('has an empty state and an error state with retry', async () => {
    let fail = true;
    start('HR_MANAGER', {
      override: (request) =>
        request.url.includes('/insights/headcount') && request.url.includes('by=country')
          ? fail
            ? jsonResponse(500, { success: false, message: 'Boom', code: 'INTERNAL_ERROR' })
            : apiSuccess([])
          : undefined,
    });
    const region = await section('Headcount');

    const alert = await within(region).findByRole('alert');
    fail = false;
    await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }));

    expect(
      await within(region).findByText('There are no employees to count yet.'),
    ).toBeInTheDocument();
  });
});
