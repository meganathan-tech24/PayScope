import { useQuery } from '@tanstack/react-query';

import { insightsService, type HeadcountBy } from '../../insights/services/insights.service';

// There is no endpoint for "all departments", but the headcount insight lists every one
// (open to both roles), so the filter dropdowns reuse it.
export function useFilterOptions(by: Exclude<HeadcountBy, 'employmentType'>) {
  return useQuery({
    queryKey: ['insights', 'headcount', by],
    queryFn: () => insightsService.headcount(by),
    staleTime: 5 * 60 * 1000,
    select: (rows) => rows.map((row) => row.key).sort((a, b) => a.localeCompare(b)),
  });
}
