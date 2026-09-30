import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import {
  parseInsightsParams,
  toInsightsSearchParams,
  type InsightsParams,
} from '../lib/insights-params';

// The selected currency, the USD switch and the two chart dimensions live in the URL, so a
// view can be shared and the back button works, like the employee list.
export function useInsightsParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => parseInsightsParams(searchParams), [searchParams]);

  const update = useCallback(
    (patch: Partial<InsightsParams>) =>
      setSearchParams(toInsightsSearchParams({ ...params, ...patch }), { replace: true }),
    [params, setSearchParams],
  );

  return { params, update };
}
