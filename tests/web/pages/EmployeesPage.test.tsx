import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { employeeJson, listPage, stubAppApi, type TestRole } from '@tests/helpers/app-api.js';
import { jsonResponse } from '@tests/helpers/fetch-mock.js';
import { renderAt } from '@tests/helpers/render.js';
import { AppRoutes } from '@web/app/router/routes';
import { TOKEN_KEY } from '@web/features/auth/services/token-storage';

function Location() {
  const location = useLocation();
  return <p data-testid="location">{`${location.pathname}${location.search}`}</p>;
}

function open(role: TestRole, path = '/app/employees') {
  window.localStorage.setItem(TOKEN_KEY, 'valid.token.value');
  return {
    render: () =>
      renderAt(
        <>
          <AppRoutes />
          <Location />
        </>,
        path,
      ),
  };
}

const listUrls = (calls: { url: string }[]) =>
  calls.filter((c) => /\/employees\?/.test(c.url) || /\/employees$/.test(c.url));
const lastList = (calls: { url: string }[]) => new URL(listUrls(calls).at(-1)?.url ?? '');
const findTable = async () => screen.findByRole('table', { name: 'Employees' });
const rowIn = async (name: RegExp) => within(await findTable()).findByRole('row', { name });

async function ready() {
  await screen.findByRole('heading', { level: 1, name: 'Employees' });
}

describe('employees page, HR manager', () => {
  it('shows each salary in its own currency, with a column for it and no totals', async () => {
    stubAppApi({
      role: 'HR_MANAGER',
      list: () =>
        listPage([
          employeeJson({ fullName: 'Grace Hopper', salary: 7_800_000, currency: 'GBP' }),
          employeeJson({
            fullName: 'Taro Yamada',
            salary: 15_000_000,
            currency: 'JPY',
            country: 'JP',
          }),
        ]),
    });
    open('HR_MANAGER').render();

    const grace = await rowIn(/Grace Hopper/);
    const taro = await rowIn(/Taro Yamada/);

    expect(
      within(await findTable()).getByRole('columnheader', { name: /Salary/ }),
    ).toBeInTheDocument();
    expect(within(grace).getByText('£78,000.00')).toBeInTheDocument();
    expect(within(taro).getByText('¥15,000,000')).toBeInTheDocument();
    expect(screen.queryByText(/total/i)).not.toBeInTheDocument();
  });

  it('offers salary as a sort option', async () => {
    stubAppApi({ role: 'HR_MANAGER', list: () => listPage([employeeJson()]) });
    open('HR_MANAGER').render();
    await ready();

    const sortBy = await screen.findByLabelText('Sort by');

    expect(within(sortBy).getByRole('option', { name: 'Salary' })).toBeInTheDocument();
  });
});

describe('employees page, viewer', () => {
  it('has no salary column, no salary text, no sort by salary and no write controls', async () => {
    stubAppApi({
      role: 'VIEWER',
      list: () => listPage([employeeJson({ fullName: 'Grace Hopper' }, 'VIEWER')]),
    });
    open('VIEWER').render();

    await rowIn(/Grace Hopper/);

    expect(screen.queryByRole('columnheader', { name: /Salary/ })).not.toBeInTheDocument();
    expect(within(await findTable()).queryByText(/£|\$|¥|€/)).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Salary' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /Actions/ })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /add employee|edit|delete/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/salaries are not shown to your account/i)).toBeInTheDocument();
  });

  it('falls back to the default sort when the URL asks for salary', async () => {
    const { calls } = stubAppApi({
      role: 'VIEWER',
      list: () => listPage([employeeJson({}, 'VIEWER')]),
    });
    open('VIEWER', '/app/employees?sortBy=salary&sortDir=desc').render();
    await ready();

    await waitFor(() => expect(listUrls(calls).length).toBeGreaterThan(0));

    expect(lastList(calls).searchParams.get('sortBy')).toBe('fullName');
  });
});

describe('employees page, filters, sort and pagination', () => {
  it('reads the URL on load and sends it to the API', async () => {
    const { calls } = stubAppApi({ role: 'HR_MANAGER', list: () => listPage([employeeJson()]) });
    open('HR_MANAGER', '/app/employees?page=2&country=DE&sortBy=salary&sortDir=desc').render();
    await ready();

    await waitFor(() => expect(listUrls(calls).length).toBeGreaterThan(0));

    expect(Object.fromEntries(lastList(calls).searchParams)).toMatchObject({
      page: '2',
      country: 'DE',
      sortBy: 'salary',
      sortDir: 'desc',
      pageSize: '25',
    });
  });

  it('changing a filter requests it, updates the URL and returns to page 1', async () => {
    const { calls } = stubAppApi({ role: 'HR_MANAGER', list: () => listPage([employeeJson()]) });
    open('HR_MANAGER', '/app/employees?page=3').render();
    await ready();
    await screen.findByRole('option', { name: 'Germany' });

    await userEvent.selectOptions(screen.getByLabelText('Country'), 'DE');
    await userEvent.selectOptions(screen.getByLabelText('Department'), 'Finance');

    await waitFor(() => expect(lastList(calls).searchParams.get('department')).toBe('Finance'));
    expect(lastList(calls).searchParams.get('country')).toBe('DE');
    expect(lastList(calls).searchParams.get('page')).toBe('1');
    expect(screen.getByTestId('location')).toHaveTextContent('country=DE');
    expect(screen.getByTestId('location')).not.toHaveTextContent('page=');
  });

  it('debounces the search: the URL follows the typing, the request waits for a pause', async () => {
    const { calls } = stubAppApi({ role: 'HR_MANAGER', list: () => listPage([employeeJson()]) });
    open('HR_MANAGER').render();
    await ready();
    await waitFor(() => expect(listUrls(calls).length).toBe(1));

    await userEvent.type(screen.getByLabelText('Search by name or email'), 'ada');

    expect(screen.getByTestId('location')).toHaveTextContent('search=ada');
    expect(listUrls(calls).filter((c) => c.url.includes('search=')).length).toBeLessThan(3);
    await waitFor(() => expect(lastList(calls).searchParams.get('search')).toBe('ada'));
    expect(listUrls(calls).filter((c) => /search=(a|ad)(&|$)/.test(c.url))).toHaveLength(0);
  });

  it('sorts by a column header, toggles the direction, and marks the sorted column', async () => {
    const { calls } = stubAppApi({ role: 'HR_MANAGER', list: () => listPage([employeeJson()]) });
    open('HR_MANAGER').render();
    await ready();
    const header = await within(await findTable()).findByRole('columnheader', {
      name: /Job title/,
    });
    expect(header).toHaveAttribute('aria-sort', 'none');

    await userEvent.click(within(header).getByRole('button'));
    await waitFor(() => expect(lastList(calls).searchParams.get('sortBy')).toBe('jobTitle'));
    expect(lastList(calls).searchParams.get('sortDir')).toBe('asc');
    expect(header).toHaveAttribute('aria-sort', 'ascending');

    await userEvent.click(within(header).getByRole('button'));
    await waitFor(() => expect(lastList(calls).searchParams.get('sortDir')).toBe('desc'));
    expect(header).toHaveAttribute('aria-sort', 'descending');
  });

  it('pages forward and back, with the range shown and the ends disabled', async () => {
    const { calls } = stubAppApi({
      role: 'HR_MANAGER',
      list: (request) => {
        const page = Number(new URL(request.url).searchParams.get('page') ?? 1);
        return listPage([employeeJson()], { page, total: 60, totalPages: 3 });
      },
    });
    open('HR_MANAGER').render();
    await ready();

    expect(await screen.findByText('Showing 1–25 of 60')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Showing 26–50 of 60')).toBeInTheDocument();
    expect(lastList(calls).searchParams.get('page')).toBe('2');

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Showing 51–60 of 60')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(await screen.findByText('Showing 26–50 of 60')).toBeInTheDocument();
  });

  it('keeps the current rows visible, marked busy, while the next page loads', async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => (release = resolve));
    stubAppApi({
      role: 'HR_MANAGER',
      list: async (request) => {
        const page = Number(new URL(request.url).searchParams.get('page') ?? 1);
        if (page === 2) await gate;
        return listPage([employeeJson({ fullName: page === 2 ? 'Second Page' : 'First Page' })], {
          page,
          total: 60,
          totalPages: 3,
        });
      },
    });
    open('HR_MANAGER').render();
    await rowIn(/First Page/);

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(within(await findTable()).getByRole('row', { name: /First Page/ })).toBeInTheDocument();
    expect((await findTable()).closest('[aria-busy]')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('status', { name: 'Loading employees' })).not.toBeInTheDocument();
    release();
    await rowIn(/Second Page/);
  });
});

describe('employees page, states', () => {
  it('shows a skeleton for the first load', async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => (release = resolve));
    stubAppApi({
      role: 'HR_MANAGER',
      list: async () => {
        await gate;
        return listPage([employeeJson({ fullName: 'Loaded Person' })]);
      },
    });
    open('HR_MANAGER').render();
    await ready();

    expect(await screen.findByRole('status', { name: 'Loading employees' })).toBeInTheDocument();
    release();
    await rowIn(/Loaded Person/);
    expect(screen.queryByRole('status', { name: 'Loading employees' })).not.toBeInTheDocument();
  });

  it('shows an empty state with no filters', async () => {
    stubAppApi({ role: 'HR_MANAGER', list: () => listPage([]) });
    open('HR_MANAGER').render();

    expect(await screen.findByRole('heading', { name: 'No employees yet' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear filters', hidden: false })).toBeDisabled();
  });

  it('shows a filtered empty state whose Clear filters resets the URL', async () => {
    stubAppApi({ role: 'HR_MANAGER', list: () => listPage([]) });
    open('HR_MANAGER', '/app/employees?country=DE&search=zzz').render();

    expect(
      await screen.findByRole('heading', { name: 'No employees match these filters' }),
    ).toBeInTheDocument();
    await userEvent.click(
      within(screen.getByRole('main')).getAllByRole('button', { name: 'Clear filters' }).at(-1)!,
    );

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/app/employees'));
    expect(screen.getByTestId('location')).not.toHaveTextContent('country=');
    expect(screen.getByLabelText('Search by name or email')).toHaveValue('');
  });

  it('shows an error state with a retry that recovers', async () => {
    let fail = true;
    stubAppApi({
      role: 'HR_MANAGER',
      list: () =>
        fail
          ? jsonResponse(500, { success: false, message: 'Boom', code: 'INTERNAL_ERROR' })
          : listPage([employeeJson({ fullName: 'Recovered Person' })]),
    });
    open('HR_MANAGER').render();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('We could not load employees');
    fail = false;
    await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }));

    await rowIn(/Recovered Person/);
    expect(screen.queryByText('We could not load employees')).not.toBeInTheDocument();
  });
});

describe('employees page, cards and export', () => {
  it('renders the same employees as cards for small screens (with the same salary rules)', async () => {
    stubAppApi({
      role: 'HR_MANAGER',
      list: () => listPage([employeeJson({ fullName: 'Card Person', salary: 7_800_000 })]),
    });
    open('HR_MANAGER').render();

    const cards = await screen.findByRole('list', { name: 'Employees' });

    expect(within(cards).getByText('Card Person')).toBeInTheDocument();
    expect(within(cards).getByText('£78,000.00')).toBeInTheDocument();
  });

  it('gives a viewer cards without salary', async () => {
    stubAppApi({
      role: 'VIEWER',
      list: () => listPage([employeeJson({ fullName: 'Card Person' }, 'VIEWER')]),
    });
    open('VIEWER').render();

    const cards = await screen.findByRole('list', { name: 'Employees' });

    expect(within(cards).getByText('Card Person')).toBeInTheDocument();
    expect(within(cards).queryByText('Salary')).not.toBeInTheDocument();
  });

  it('exports with the current filters and sort, and saves the file', async () => {
    const createUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:csv');
    const { calls } = stubAppApi({
      role: 'HR_MANAGER',
      list: () => listPage([employeeJson()]),
      other: (request) =>
        request.url.includes('/employees/export.csv')
          ? new Response('id,fullName\r\n', {
              headers: { 'Content-Disposition': 'attachment; filename="employees.csv"' },
            })
          : undefined,
    });
    open('HR_MANAGER', '/app/employees?country=DE&sortBy=hireDate&sortDir=desc&page=4').render();
    await ready();

    await userEvent.click(await screen.findByRole('button', { name: 'Export CSV' }));

    await waitFor(() => expect(createUrl).toHaveBeenCalled());
    const exportCall = calls.find((c) => c.url.includes('/employees/export.csv'));
    expect(Object.fromEntries(new URL(exportCall?.url ?? '').searchParams)).toEqual({
      country: 'DE',
      sortBy: 'hireDate',
      sortDir: 'desc',
    });
  });

  it('says so when the export fails', async () => {
    stubAppApi({
      role: 'VIEWER',
      list: () => listPage([employeeJson({}, 'VIEWER')]),
      other: (request) =>
        request.url.includes('/employees/export.csv')
          ? jsonResponse(500, { success: false, message: 'Boom', code: 'INTERNAL_ERROR' })
          : undefined,
    });
    open('VIEWER').render();

    await userEvent.click(await screen.findByRole('button', { name: 'Export CSV' }));

    expect(await screen.findByText(/the export failed/i)).toBeInTheDocument();
  });
});
