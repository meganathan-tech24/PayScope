import type { TestRole } from './app-api.js';
import type { RecordedRequest } from './fetch-mock.js';
import { apiSuccess } from './fetch-mock.js';

// A small, hand-made organisation. Minor units; EUR is shared by Germany and France.
const FULL_ROWS = [
  {
    key: 'DE',
    currency: 'EUR',
    headcount: 6,
    min: 4_000_000,
    p25: 5_000_000,
    median: 6_000_000,
    avg: 6_100_000,
    p75: 7_000_000,
    max: 9_000_000,
  },
  {
    key: 'FR',
    currency: 'EUR',
    headcount: 6,
    min: 3_500_000,
    p25: 4_500_000,
    median: 5_500_000,
    avg: 5_600_000,
    p75: 6_500_000,
    max: 8_000_000,
  },
  {
    key: 'GB',
    currency: 'GBP',
    headcount: 8,
    min: 3_000_000,
    p25: 4_000_000,
    median: 5_000_000,
    avg: 5_100_000,
    p75: 6_000_000,
    max: 7_500_000,
  },
  {
    key: 'JP',
    currency: 'JPY',
    headcount: 5,
    min: 4_000_000,
    p25: 5_500_000,
    median: 7_000_000,
    avg: 7_100_000,
    p75: 8_500_000,
    max: 12_000_000,
  },
  {
    key: 'US',
    currency: 'USD',
    headcount: 10,
    min: 5_000_000,
    p25: 7_000_000,
    median: 9_000_000,
    avg: 9_200_000,
    p75: 11_000_000,
    max: 15_000_000,
  },
];

export const HEADCOUNT_BY_COUNTRY = [
  { key: 'US', headcount: 10 },
  { key: 'GB', headcount: 8 },
  { key: 'DE', headcount: 6 },
  { key: 'FR', headcount: 6 },
  { key: 'JP', headcount: 5 },
];

const strip = ({ min: _min, max: _max, ...basic }: (typeof FULL_ROWS)[number]) => basic;

const meta = (extra: Record<string, unknown> = {}) => ({
  view: 'native',
  approximate: false,
  excludedHeadcount: 0,
  ...extra,
});

export interface InsightsFixtureOptions {
  role: TestRole;
  /** Replace the answer for one endpoint, for example to return an error. */
  override?: (
    request: RecordedRequest,
    path: string,
  ) => Response | undefined | Promise<Response | undefined>;
  /** Groups a VIEWER is told were hidden. */
  hiddenGroups?: number;
}

// Answers the insights endpoints the dashboard calls, shaped for the role: a VIEWER's rows
// have no min or max keys at all.
export function insightsApi({ role, override, hiddenGroups = 0 }: InsightsFixtureOptions) {
  return async (request: RecordedRequest) => {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^.*\/insights/, '');
    const q = url.searchParams;
    if (!request.url.includes('/insights/')) return undefined;

    const custom = await override?.(request, path);
    if (custom) return custom;

    const usd = q.get('view') === 'usd';
    const shape = (row: (typeof FULL_ROWS)[number]) => (role === 'HR_MANAGER' ? row : strip(row));

    if (path === '/stats') {
      const groupBy = q.get('groupBy') ?? 'country';
      if (groupBy === 'country') {
        const rows = usd ? FULL_ROWS.map((r) => ({ ...r, currency: 'USD' })) : FULL_ROWS;
        return apiSuccess({
          ...meta({
            view: usd ? 'usd' : 'native',
            approximate: usd,
            excludedHeadcount: usd ? 2 : 0,
          }),
          suppressedGroups: role === 'VIEWER' ? hiddenGroups : 0,
          rows: rows.map(shape),
        });
      }
      const currency = usd ? 'USD' : (q.get('currency') ?? 'EUR');
      const keys = groupBy === 'jobTitle' ? ['Analyst', 'Engineer'] : ['Finance', 'Engineering'];
      return apiSuccess({
        ...meta({ view: usd ? 'usd' : 'native', approximate: usd }),
        suppressedGroups: role === 'VIEWER' ? hiddenGroups : 0,
        rows: keys.map((key, index) => shape({ ...FULL_ROWS[index]!, key, currency })),
      });
    }

    if (path === '/headcount') {
      const by = q.get('by');
      if (by === 'employmentType') {
        return apiSuccess([
          { key: 'FULL_TIME', headcount: 30 },
          { key: 'CONTRACT', headcount: 5 },
        ]);
      }
      if (by === 'country') return apiSuccess(HEADCOUNT_BY_COUNTRY);
      return undefined;
    }

    if (path === '/salary-bands') {
      return apiSuccess({
        ...meta({ view: usd ? 'usd' : 'native', approximate: usd, excludedHeadcount: usd ? 2 : 0 }),
        currency: usd ? 'USD' : (q.get('currency') ?? 'EUR'),
        headcount: 12,
        suppressed: false,
        buckets: [
          { from: 3_500_000, to: 5_000_000, count: 4 },
          { from: 5_000_000, to: 6_500_000, count: 5 },
          { from: 6_500_000, to: 8_000_000, count: 3 },
        ],
      });
    }

    if (path === '/tenure') {
      const currency = usd ? 'USD' : (q.get('currency') ?? 'EUR');
      return apiSuccess({
        ...meta({ view: usd ? 'usd' : 'native', approximate: usd }),
        suppressedGroups: role === 'VIEWER' ? hiddenGroups : 0,
        bands: [
          { band: '<1y', currency, headcount: 5, median: 4_000_000, avg: 4_100_000 },
          { band: '1-3y', currency, headcount: 6, median: 5_000_000, avg: 5_200_000 },
          { band: '5-10y', currency, headcount: 7, median: 6_500_000, avg: 6_600_000 },
        ],
      });
    }

    if (path === '/outliers') {
      return apiSuccess({
        total: 3,
        rows: [
          {
            id: 'o1',
            fullName: 'Outlier High',
            jobTitle: 'Engineer',
            country: 'DE',
            currency: 'EUR',
            employmentType: 'CONTRACT',
            salary: 12_000_000,
            groupMedian: 6_000_000,
            deviationPct: 100,
            groupSize: 9,
          },
          {
            id: 'o2',
            fullName: 'Outlier Low',
            jobTitle: 'Analyst',
            country: 'FR',
            currency: 'EUR',
            employmentType: 'FULL_TIME',
            salary: 2_200_000,
            groupMedian: 5_500_000,
            deviationPct: -60,
            groupSize: 12,
          },
        ],
      });
    }
    return undefined;
  };
}
