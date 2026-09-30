import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { apiSuccess, stubFetch } from '@tests/helpers/fetch-mock.js';
import { usePayByGroup } from '@web/features/insights/hooks/useInsights';
import { currencyOptions, resolveCurrency } from '@web/features/insights/lib/currencies';
import {
  parseInsightsParams,
  toInsightsSearchParams,
} from '@web/features/insights/lib/insights-params';
import { insightsService } from '@web/features/insights/services/insights.service';

const query = (url: string) => Object.fromEntries(new URL(url).searchParams);

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('insightsService requests', () => {
  it('asks for the native view by leaving it out, with the currency', async () => {
    const { calls } = stubFetch(() => apiSuccess({}));

    await insightsService.stats('jobTitle', { view: 'native', currency: 'EUR' });
    await insightsService.salaryBands({ view: 'native', currency: 'GBP' });
    await insightsService.tenure({ view: 'native', currency: 'GBP' });

    expect(query(calls[0]?.url ?? '')).toEqual({ groupBy: 'jobTitle', currency: 'EUR' });
    expect(query(calls[1]?.url ?? '')).toEqual({ buckets: '10', currency: 'GBP' });
    expect(query(calls[2]?.url ?? '')).toEqual({ currency: 'GBP' });
  });

  it('asks for the USD view without a currency, even if one is selected', async () => {
    const { calls } = stubFetch(() => apiSuccess({}));

    await insightsService.stats('country', { view: 'usd', currency: 'EUR' });
    await insightsService.salaryBands({ view: 'usd', currency: 'EUR' });

    expect(query(calls[0]?.url ?? '')).toEqual({ groupBy: 'country', view: 'usd' });
    expect(query(calls[1]?.url ?? '')).toEqual({ buckets: '10', view: 'usd' });
  });

  it('asks for headcount and outliers', async () => {
    const { calls } = stubFetch(() => apiSuccess({}));

    await insightsService.headcount('employmentType');
    await insightsService.outliers('GBP');
    await insightsService.outliers(undefined, 10);

    expect(query(calls[0]?.url ?? '')).toEqual({ by: 'employmentType' });
    expect(query(calls[1]?.url ?? '')).toEqual({ limit: '25', currency: 'GBP' });
    expect(query(calls[2]?.url ?? '')).toEqual({ limit: '10' });
  });
});

describe('currency options', () => {
  const rows = [
    { currency: 'EUR', headcount: 3 },
    { currency: 'GBP', headcount: 5 },
    { currency: 'EUR', headcount: 4 },
    { currency: 'USD', headcount: 7 },
  ];

  it('lists each currency once with its headcount, most-used first', () => {
    expect(currencyOptions(rows)).toEqual([
      { code: 'EUR', headcount: 7 },
      { code: 'USD', headcount: 7 },
      { code: 'GBP', headcount: 5 },
    ]);
  });

  it('keeps a requested currency that exists and otherwise uses the most-used one', () => {
    const options = currencyOptions(rows);

    expect(resolveCurrency('GBP', options)).toBe('GBP');
    expect(resolveCurrency('JPY', options)).toBe('EUR');
    expect(resolveCurrency('', options)).toBe('EUR');
    expect(resolveCurrency('GBP', [])).toBe('');
  });
});

describe('insights URL state', () => {
  it('has safe defaults and rejects invalid values', () => {
    expect(parseInsightsParams(new URLSearchParams(''))).toEqual({
      currency: '',
      usd: false,
      payBy: 'country',
      headcountBy: 'country',
    });
    expect(
      parseInsightsParams(new URLSearchParams('currency=bogus&usd=yes&payBy=salary&headcountBy=x')),
    ).toEqual({ currency: '', usd: false, payBy: 'country', headcountBy: 'country' });
  });

  it('round-trips and leaves defaults out', () => {
    const params = {
      currency: 'GBP',
      usd: true,
      payBy: 'department',
      headcountBy: 'jobTitle',
    } as const;

    expect(parseInsightsParams(toInsightsSearchParams(params))).toEqual(params);
    expect(
      toInsightsSearchParams({
        currency: '',
        usd: false,
        payBy: 'country',
        headcountBy: 'country',
      }).toString(),
    ).toBe('');
  });
});

describe('usePayByGroup', () => {
  const stats = (rows: unknown[]) =>
    apiSuccess({
      view: 'native',
      approximate: false,
      excludedHeadcount: 0,
      suppressedGroups: 0,
      rows,
    });
  const row = (key: string, currency: string) => ({
    key,
    currency,
    headcount: 5,
    p25: 1,
    median: 2,
    avg: 2,
    p75: 3,
  });

  it('filters country rows to the selected currency without a second request', async () => {
    const { calls } = stubFetch(() =>
      stats([row('DE', 'EUR'), row('FR', 'EUR'), row('GB', 'GBP')]),
    );

    const { result } = renderHook(() => usePayByGroup('country', false, 'EUR'), { wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.rows.map((r) => r.key)).toEqual(['DE', 'FR']);
    expect(query(calls[0]?.url ?? '')).toEqual({ groupBy: 'country' });
  });

  it('asks for other groupings in the selected currency and waits until one is chosen', async () => {
    const { calls } = stubFetch(() => stats([row('Analyst', 'GBP')]));

    const idle = renderHook(() => usePayByGroup('jobTitle', false, ''), { wrapper });
    expect(idle.result.current.fetchStatus).toBe('idle');
    const active = renderHook(() => usePayByGroup('jobTitle', false, 'GBP'), { wrapper });

    await waitFor(() => expect(active.result.current.data).toBeDefined());
    expect(calls).toHaveLength(1);
    expect(query(calls[0]?.url ?? '')).toEqual({ groupBy: 'jobTitle', currency: 'GBP' });
  });
});
