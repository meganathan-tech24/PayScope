import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { jsonResponse, stubFetch } from '@tests/helpers/fetch-mock.js';
import { useDebouncedValue } from '@web/features/employees/hooks/useDebouncedValue';
import { useEmployeeList } from '@web/features/employees/hooks/useEmployeeList';
import { DEFAULT_PARAMS } from '@web/features/employees/lib/search-params';
import { employeesService } from '@web/features/employees/services/employees.service';

const page = (items: unknown[], pageNumber = 1) =>
  jsonResponse(200, {
    success: true,
    data: items,
    meta: { requestId: 'r', page: pageNumber, pageSize: 25, total: 60, totalPages: 3 },
  });

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('employeesService', () => {
  it('sends the filters, sort, page and page size, leaving empty ones out', async () => {
    const { calls } = stubFetch(() => page([]));

    await employeesService.list({
      ...DEFAULT_PARAMS,
      page: 2,
      country: 'GB',
      sortBy: 'hireDate',
      sortDir: 'desc',
    });

    const url = new URL(calls[0]?.url ?? '');
    expect(url.pathname).toMatch(/\/employees$/);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      country: 'GB',
      sortBy: 'hireDate',
      sortDir: 'desc',
      page: '2',
      pageSize: '25',
    });
  });

  it('exports with the same filters and sort but no paging', async () => {
    const { calls } = stubFetch(
      () =>
        new Response('id\r\n', {
          headers: { 'Content-Disposition': 'attachment; filename="employees.csv"' },
        }),
    );

    const file = await employeesService.exportCsv({
      ...DEFAULT_PARAMS,
      page: 3,
      search: 'ada',
      department: 'Finance',
    });

    const url = new URL(calls[0]?.url ?? '');
    expect(url.pathname).toMatch(/\/employees\/export\.csv$/);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      search: 'ada',
      department: 'Finance',
      sortBy: 'fullName',
      sortDir: 'asc',
    });
    expect(file.filename).toBe('employees.csv');
  });
});

describe('useEmployeeList', () => {
  it('keeps the previous rows on screen while the next page loads', async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => (release = resolve));
    stubFetch(async ({ url }) => {
      if (url.includes('page=2')) {
        await gate;
        return page([{ id: 'second' }], 2);
      }
      return page([{ id: 'first' }], 1);
    });

    const { result, rerender } = renderHook(
      ({ p }) => useEmployeeList({ ...DEFAULT_PARAMS, page: p }),
      { wrapper, initialProps: { p: 1 } },
    );
    await waitFor(() => expect(result.current.data?.data).toEqual([{ id: 'first' }]));

    rerender({ p: 2 });

    expect(result.current.data?.data).toEqual([{ id: 'first' }]);
    expect(result.current.isPlaceholderData).toBe(true);
    release();
    await waitFor(() => expect(result.current.data?.data).toEqual([{ id: 'second' }]));
    expect(result.current.isPlaceholderData).toBe(false);
  });
});

describe('useDebouncedValue', () => {
  it('only passes a value on once it has stopped changing', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'ad' });
    rerender({ value: 'ada' });
    expect(result.current).toBe('a');
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe('a');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('ada');
    vi.useRealTimers();
  });
});
