import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { useAuth } from '../../auth/hooks/useAuth';
import { DEFAULT_PARAMS, parseEmployeeParams, toSearchParams } from '../lib/search-params';
import type { EmployeeListParams } from '../types';

// Filters, sort and page live in the URL, so a view can be reloaded, shared and bookmarked,
// and the back button steps through it.
export function useEmployeeParams() {
  const { user } = useAuth();
  const role = user?.role ?? 'VIEWER';
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => parseEmployeeParams(searchParams, role), [searchParams, role]);

  // Changing a filter, the search or the sort returns to page 1; changing the page does not.
  const update = useCallback(
    (patch: Partial<EmployeeListParams>) => {
      const changesResults = Object.keys(patch).some((key) => key !== 'page');
      setSearchParams(
        toSearchParams({ ...params, ...(changesResults ? { page: 1 } : {}), ...patch }),
      );
    },
    [params, setSearchParams],
  );

  const clearFilters = useCallback(
    () =>
      update({
        search: DEFAULT_PARAMS.search,
        country: DEFAULT_PARAMS.country,
        department: DEFAULT_PARAMS.department,
        jobTitle: DEFAULT_PARAMS.jobTitle,
      }),
    [update],
  );

  const hasFilters = Boolean(
    params.search || params.country || params.department || params.jobTitle,
  );

  return { params, update, clearFilters, hasFilters };
}
