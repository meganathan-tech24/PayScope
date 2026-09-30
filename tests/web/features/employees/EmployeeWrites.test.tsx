import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { employeeJson, listPage, stubAppApi, type TestRole } from '@tests/helpers/app-api.js';
import { apiError, apiSuccess, jsonResponse } from '@tests/helpers/fetch-mock.js';
import type { RecordedRequest } from '@tests/helpers/fetch-mock.js';
import { renderAt } from '@tests/helpers/render.js';
import { AppRoutes } from '@web/app/router/routes';
import { TOKEN_KEY } from '@web/features/auth/services/token-storage';

const isWrite = (request: RecordedRequest) => ['POST', 'PUT', 'DELETE'].includes(request.method);
const writes = (calls: RecordedRequest[]) => calls.filter(isWrite);
const listCalls = (calls: RecordedRequest[]) =>
  calls.filter((c) => c.method === 'GET' && /\/employees(\?|$)/.test(c.url));

function start(
  role: TestRole,
  options: Parameters<typeof stubAppApi>[0] extends infer O ? Partial<O> : never = {},
  path = '/app/employees',
) {
  window.localStorage.setItem(TOKEN_KEY, 'valid.token.value');
  const api = stubAppApi({
    role,
    list: () => listPage([employeeJson({ fullName: 'Grace Hopper', salary: 7_800_000 })]),
    ...options,
  });
  renderAt(<AppRoutes />, path);
  return api;
}

const dialog = (name: string) => screen.findByRole('dialog', { name });

async function openAdd() {
  await userEvent.click(await screen.findByRole('button', { name: 'Add employee' }));
  return within(await dialog('Add employee'));
}

async function fillValid(form: ReturnType<typeof within>, overrides: Record<string, string> = {}) {
  const v = {
    'Full name': 'Ada Lovelace',
    Email: 'ada@example.com',
    'Job title': 'Analyst',
    Department: 'Finance',
    'Salary (per year)': '85,000.50',
    'Hire date': '2020-01-15',
    ...overrides,
  };
  for (const [label, value] of Object.entries(v)) {
    await userEvent.type(form.getByLabelText(label), value);
  }
  await userEvent.selectOptions(form.getByLabelText('Country'), overrides.Country ?? 'GB');
  await userEvent.selectOptions(form.getByLabelText('Currency'), overrides.Currency ?? 'GBP');
}

describe('employee writes, who gets the controls', () => {
  it('gives an HR manager Add, and Edit and Delete named for each employee', async () => {
    start('HR_MANAGER');

    expect(await screen.findByRole('button', { name: 'Add employee' })).toBeInTheDocument();
    expect(
      (await screen.findAllByRole('button', { name: 'Edit Grace Hopper' })).length,
    ).toBeGreaterThan(0);
    expect(
      (await screen.findAllByRole('button', { name: 'Delete Grace Hopper' })).length,
    ).toBeGreaterThan(0);
  });

  it('gives a viewer none of them', async () => {
    start('VIEWER', {
      list: () => listPage([employeeJson({ fullName: 'Grace Hopper' }, 'VIEWER')]),
    });
    await screen.findByRole('table', { name: 'Employees' });

    expect(
      screen.queryByRole('button', { name: /add employee|edit|delete/i }),
    ).not.toBeInTheDocument();
  });
});

describe('employee form validation', () => {
  it('shows an error for every empty field, focuses the first, and sends nothing', async () => {
    const { calls } = start('HR_MANAGER');
    const form = await openAdd();

    await userEvent.click(form.getByRole('button', { name: 'Add employee' }));

    expect(form.getByLabelText('Full name')).toHaveAccessibleDescription('Full name is required');
    expect(form.getByLabelText('Email')).toHaveAccessibleDescription('Invalid email address');
    expect(form.getByLabelText('Job title')).toHaveAccessibleDescription('Job title is required');
    expect(form.getByLabelText('Department')).toHaveAccessibleDescription('Department is required');
    expect(form.getByLabelText('Country')).toHaveAccessibleDescription('Select a country');
    expect(form.getByLabelText('Currency')).toHaveAccessibleDescription('Select a currency');
    expect(form.getByLabelText('Salary (per year)')).toHaveAccessibleDescription(/Enter a salary/);
    expect(form.getByLabelText('Hire date')).toHaveAccessibleDescription('Enter the hire date');
    expect(form.getByLabelText('Full name')).toHaveFocus();
    expect(writes(calls)).toHaveLength(0);
  });

  it.each([
    ['a malformed email', { Email: 'not-an-email' }, 'Email', 'Invalid email address'],
    [
      'a salary that is not a number',
      { 'Salary (per year)': 'lots' },
      'Salary (per year)',
      /at most 2 decimals/,
    ],
    ['a negative salary', { 'Salary (per year)': '-5' }, 'Salary (per year)', /at most 2 decimals/],
    [
      'too many decimals for the currency',
      { 'Salary (per year)': '10.999' },
      'Salary (per year)',
      /at most 2 decimals/,
    ],
    [
      'a hire date in the future',
      { 'Hire date': '2999-01-01' },
      'Hire date',
      'The hire date cannot be in the future',
    ],
  ])('rejects %s', async (_label, overrides, field, message) => {
    const { calls } = start('HR_MANAGER');
    const form = await openAdd();
    await fillValid(form, overrides as Record<string, string>);

    await userEvent.click(form.getByRole('button', { name: 'Add employee' }));

    expect(form.getByLabelText(field)).toHaveAccessibleDescription(message);
    expect(writes(calls)).toHaveLength(0);
  });

  it('asks for whole amounts when the currency has no decimals, and says so in the hint', async () => {
    start('HR_MANAGER');
    const form = await openAdd();
    await userEvent.selectOptions(form.getByLabelText('Currency'), 'JPY');

    expect(form.getByLabelText('Salary (per year)')).toHaveAccessibleDescription(
      /whole numbers only/,
    );
    await fillValid(form, { 'Salary (per year)': '15000.5', Currency: 'JPY', Country: 'JP' });
    await userEvent.click(form.getByRole('button', { name: 'Add employee' }));

    expect(form.getByLabelText('Salary (per year)')).toHaveAccessibleDescription(/whole amount/);
  });
});

describe('creating an employee', () => {
  it('converts the salary to minor units, sends the plain date, confirms, closes and refreshes', async () => {
    const { calls } = start('HR_MANAGER', {
      other: (request) => (request.method === 'POST' ? apiSuccess(employeeJson(), 201) : undefined),
    });
    const before = listCalls(calls).length;
    const form = await openAdd();
    await fillValid(form);

    await userEvent.click(form.getByRole('button', { name: 'Add employee' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(writes(calls)[0]).toMatchObject({
      method: 'POST',
      json: {
        fullName: 'Ada Lovelace',
        email: 'ada@example.com',
        jobTitle: 'Analyst',
        department: 'Finance',
        country: 'GB',
        currency: 'GBP',
        salary: 8_500_050,
        employmentType: 'FULL_TIME',
        hireDate: '2020-01-15',
      },
    });
    expect(await screen.findByText('Employee created')).toBeInTheDocument();
    await waitFor(() => expect(listCalls(calls).length).toBeGreaterThan(before));
  });

  it('sends yen as whole units, not hundredths', async () => {
    const { calls } = start('HR_MANAGER', {
      other: (request) => (request.method === 'POST' ? apiSuccess(employeeJson(), 201) : undefined),
    });
    const form = await openAdd();
    await fillValid(form, { 'Salary (per year)': '15,000,000', Currency: 'JPY', Country: 'JP' });

    await userEvent.click(form.getByRole('button', { name: 'Add employee' }));

    await waitFor(() => expect(writes(calls)).toHaveLength(1));
    expect(writes(calls)[0]?.json).toMatchObject({ currency: 'JPY', salary: 15_000_000 });
  });

  it('shows a duplicate email on the email field and keeps what was typed', async () => {
    start('HR_MANAGER', {
      other: (request) =>
        request.method === 'POST'
          ? apiError(409, 'EMPLOYEE_EMAIL_TAKEN', 'An employee with this email already exists')
          : undefined,
    });
    const form = await openAdd();
    await fillValid(form);

    await userEvent.click(form.getByRole('button', { name: 'Add employee' }));

    expect(await form.findByText(/employee with this email already exists/i)).toBeInTheDocument();
    expect(form.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(form.getByLabelText('Full name')).toHaveValue('Ada Lovelace');
    expect(screen.getByRole('dialog', { name: 'Add employee' })).toBeInTheDocument();
  });

  it('shows the API message for a rejected request, and disables the form while saving', async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => (release = resolve));
    start('HR_MANAGER', {
      other: async (request) => {
        if (request.method !== 'POST') return undefined;
        await gate;
        return apiError(400, 'VALIDATION_ERROR', 'salary: Salary is unrealistically large');
      },
    });
    const form = await openAdd();
    await fillValid(form);

    await userEvent.click(form.getByRole('button', { name: 'Add employee' }));

    expect(await form.findByRole('button', { name: /saving/i })).toBeDisabled();
    expect(form.getByLabelText('Full name')).toBeDisabled();
    release();
    expect(await form.findByRole('alert')).toHaveTextContent('Salary is unrealistically large');
  });

  it('closes without saving on Cancel and on Escape', async () => {
    const { calls } = start('HR_MANAGER');
    const form = await openAdd();
    await userEvent.click(form.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await openAdd();
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(writes(calls)).toHaveLength(0);
  });
});

describe('editing an employee', () => {
  it('prefills the form (salary in major units) and saves the change with a PUT', async () => {
    const employee = employeeJson({
      fullName: 'Grace Hopper',
      salary: 7_800_000,
      currency: 'GBP',
      jobTitle: 'Engineer',
    });
    const { calls } = start('HR_MANAGER', {
      list: () => listPage([employee]),
      other: (request) => (request.method === 'PUT' ? apiSuccess(employee) : undefined),
    });
    await userEvent.click(
      (await screen.findAllByRole('button', { name: 'Edit Grace Hopper' }))[0]!,
    );
    const form = within(await dialog('Edit employee'));

    expect(form.getByLabelText('Salary (per year)')).toHaveValue('78000.00');
    expect(form.getByLabelText('Hire date')).toHaveValue('2020-01-15');
    await userEvent.clear(form.getByLabelText('Job title'));
    await userEvent.type(form.getByLabelText('Job title'), 'Staff Engineer');
    await userEvent.click(form.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(writes(calls)).toHaveLength(1));
    expect(writes(calls)[0]?.method).toBe('PUT');
    expect(writes(calls)[0]?.url).toMatch(new RegExp(`/employees/${employee.id}$`));
    expect(writes(calls)[0]?.json).toMatchObject({
      jobTitle: 'Staff Engineer',
      salary: 7_800_000,
      currency: 'GBP',
    });
    expect(await screen.findByText('Employee updated')).toBeInTheDocument();
  });

  it('says the employee no longer exists (404) and refreshes the list', async () => {
    const { calls } = start('HR_MANAGER', {
      other: (request) =>
        request.method === 'PUT'
          ? apiError(404, 'EMPLOYEE_NOT_FOUND', 'Employee not found')
          : undefined,
    });
    await userEvent.click(
      (await screen.findAllByRole('button', { name: 'Edit Grace Hopper' }))[0]!,
    );
    const form = within(await dialog('Edit employee'));
    const before = listCalls(calls).length;

    await userEvent.click(form.getByRole('button', { name: 'Save changes' }));

    expect(await form.findByRole('alert')).toHaveTextContent(/no longer exists/i);
    await waitFor(() => expect(listCalls(calls).length).toBeGreaterThan(before));
  });
});

describe('deleting an employee', () => {
  async function openDelete() {
    await userEvent.click(
      (await screen.findAllByRole('button', { name: 'Delete Grace Hopper' }))[0]!,
    );
    return within(await dialog('Delete employee'));
  }

  it('asks first, naming the employee, and Cancel deletes nothing', async () => {
    const { calls } = start('HR_MANAGER');
    const confirm = await openDelete();

    expect(confirm.getByText('Grace Hopper')).toBeInTheDocument();
    await userEvent.click(confirm.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(writes(calls)).toHaveLength(0);
  });

  it('deletes on confirm, tells the user, and refreshes the list', async () => {
    const employee = employeeJson({ fullName: 'Grace Hopper' });
    const { calls } = start('HR_MANAGER', {
      list: () => listPage([employee]),
      other: (request) =>
        request.method === 'DELETE' ? new Response(null, { status: 204 }) : undefined,
    });
    const confirm = await openDelete();
    const before = listCalls(calls).length;

    await userEvent.click(confirm.getByRole('button', { name: 'Delete employee' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(writes(calls)[0]?.method).toBe('DELETE');
    expect(writes(calls)[0]?.url).toMatch(new RegExp(`/employees/${employee.id}$`));
    expect(await screen.findByText('Deleted Grace Hopper')).toBeInTheDocument();
    await waitFor(() => expect(listCalls(calls).length).toBeGreaterThan(before));
  });

  it('keeps the dialog open with an error when the delete fails', async () => {
    start('HR_MANAGER', {
      other: (request) =>
        request.method === 'DELETE'
          ? jsonResponse(500, { success: false, message: 'Boom', code: 'INTERNAL_ERROR' })
          : undefined,
    });
    const confirm = await openDelete();

    await userEvent.click(confirm.getByRole('button', { name: 'Delete employee' }));

    expect(await confirm.findByRole('alert')).toHaveTextContent(/something went wrong/i);
    expect(screen.getByRole('dialog', { name: 'Delete employee' })).toBeInTheDocument();
  });
});

describe('paging after a change', () => {
  it('steps back to the last page when the current page is past the end', async () => {
    const { calls } = start(
      'HR_MANAGER',
      {
        list: (request) => {
          const page = Number(new URL(request.url).searchParams.get('page') ?? 1);
          return page > 2
            ? listPage([], { page, total: 30, totalPages: 2 })
            : listPage([employeeJson()], { page, total: 30, totalPages: 2 });
        },
      },
      '/app/employees?page=9',
    );

    await waitFor(() =>
      expect(listCalls(calls).some((c) => new URL(c.url).searchParams.get('page') === '2')).toBe(
        true,
      ),
    );
    expect(await screen.findByText(/Showing 26–30 of 30|Showing 1–25 of 30/)).toBeInTheDocument();
  });
});
