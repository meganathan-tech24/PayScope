import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '../../services/http';

// A 4xx answer will not change if asked again, so only network trouble and 5xx are retried
// (twice, with a growing pause) before an error state is shown.
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) =>
          failureCount < 2 && !(error instanceof ApiError && error.status < 500),
        retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 4000),
        refetchOnWindowFocus: false,
      },
    },
  });
}
