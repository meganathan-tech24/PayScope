import type { HeadcountBy, PayGroup } from '../services/insights.service';

export interface InsightsParams {
  currency: string;
  usd: boolean;
  payBy: PayGroup;
  headcountBy: HeadcountBy;
}

export const PAY_GROUPS: readonly PayGroup[] = ['country', 'jobTitle', 'department'];
export const HEADCOUNT_DIMENSIONS: readonly HeadcountBy[] = [
  'country',
  'department',
  'jobTitle',
  'employmentType',
];

export const DEFAULT_INSIGHTS_PARAMS: InsightsParams = {
  currency: '',
  usd: false,
  payBy: 'country',
  headcountBy: 'country',
};

export function parseInsightsParams(searchParams: URLSearchParams): InsightsParams {
  const currency = (searchParams.get('currency') ?? '').trim().toUpperCase();
  const payBy = searchParams.get('payBy') as PayGroup;
  const headcountBy = searchParams.get('headcountBy') as HeadcountBy;

  return {
    currency: /^[A-Z]{3}$/.test(currency) ? currency : '',
    usd: searchParams.get('usd') === '1',
    payBy: PAY_GROUPS.includes(payBy) ? payBy : DEFAULT_INSIGHTS_PARAMS.payBy,
    headcountBy: HEADCOUNT_DIMENSIONS.includes(headcountBy)
      ? headcountBy
      : DEFAULT_INSIGHTS_PARAMS.headcountBy,
  };
}

export function toInsightsSearchParams(params: InsightsParams): URLSearchParams {
  const query = new URLSearchParams();
  if (params.currency) query.set('currency', params.currency);
  if (params.usd) query.set('usd', '1');
  if (params.payBy !== DEFAULT_INSIGHTS_PARAMS.payBy) query.set('payBy', params.payBy);
  if (params.headcountBy !== DEFAULT_INSIGHTS_PARAMS.headcountBy) {
    query.set('headcountBy', params.headcountBy);
  }
  return query;
}
