import type { HeadcountRow } from '@payscope/types';

import { apiClient } from '../../../services/api-client';
import { withQuery } from '../../../services/http';

export type HeadcountBy = 'country' | 'department' | 'jobTitle' | 'employmentType';

export const insightsService = {
  headcount: (by: HeadcountBy) =>
    apiClient.get<HeadcountRow[]>(withQuery('/insights/headcount', { by })),
};
