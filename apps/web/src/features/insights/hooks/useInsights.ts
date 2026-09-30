import type { InsightView } from '@payscope/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { insightsService, type HeadcountBy, type PayGroup } from '../services/insights.service';

// Every section has its own query, so a section that fails or is slow never blocks the rest.
// Keys start with 'insights', so saving an employee refreshes them all.
const key = (...parts: unknown[]) => ['insights', ...parts] as const;
const viewOf = (usd: boolean): InsightView => (usd ? 'usd' : 'native');

/** One row per country and currency. Also the source of the currency list and the cards. */
export function useCountryStats(usd: boolean) {
  const view = viewOf(usd);
  return useQuery({
    queryKey: key('stats', 'country', view),
    queryFn: () => insightsService.stats('country', { view }),
  });
}

export function usePayByGroup(groupBy: PayGroup, usd: boolean, currency: string) {
  const view = viewOf(usd);
  const isCountry = groupBy === 'country';
  return useQuery({
    // Country rows are fetched once for every currency and filtered here, which shares the
    // cache with useCountryStats; other groupings are asked for the selected currency.
    queryKey: key('stats', groupBy, view, isCountry ? null : currency),
    queryFn: () =>
      insightsService.stats(groupBy, { view, currency: isCountry ? undefined : currency }),
    enabled: usd || Boolean(currency),
    placeholderData: keepPreviousData,
    select: (stats) =>
      isCountry && !usd
        ? { ...stats, rows: stats.rows.filter((row) => row.currency === currency) }
        : stats,
  });
}

export function useSalaryBands(usd: boolean, currency: string) {
  const view = viewOf(usd);
  return useQuery({
    queryKey: key('bands', view, usd ? null : currency),
    queryFn: () => insightsService.salaryBands({ view, currency }),
    enabled: usd || Boolean(currency),
    placeholderData: keepPreviousData,
  });
}

export function useTenure(usd: boolean, currency: string) {
  const view = viewOf(usd);
  return useQuery({
    queryKey: key('tenure', view, usd ? null : currency),
    queryFn: () => insightsService.tenure({ view, currency }),
    enabled: usd || Boolean(currency),
    placeholderData: keepPreviousData,
  });
}

export function useHeadcount(by: HeadcountBy) {
  return useQuery({
    queryKey: key('headcount', by),
    queryFn: () => insightsService.headcount(by),
    placeholderData: keepPreviousData,
  });
}

/** HR managers only: the API answers 403 to anyone else, so it is never asked for them. */
export function useOutliers(enabled: boolean, currency: string | undefined) {
  return useQuery({
    queryKey: key('outliers', currency ?? 'all'),
    queryFn: () => insightsService.outliers(currency),
    enabled,
    placeholderData: keepPreviousData,
  });
}
