export interface ApiMeta {
  requestId: string;
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
}

export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorEnvelope {
  success: false;
  message: string;
  code: string;
  requestId: string;
}

export type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;

export function isApiSuccess<T>(envelope: ApiEnvelope<T>): envelope is ApiSuccessEnvelope<T> {
  return envelope.success;
}

export function isApiError<T>(envelope: ApiEnvelope<T>): envelope is ApiErrorEnvelope {
  return !envelope.success;
}

export type Role = 'HR_MANAGER' | 'VIEWER';

// Wire shapes: what the JSON actually carries, so dates are ISO strings.

/** What every signed-in role may see. There is deliberately no `salary` key. */
export interface EmployeeDirectory {
  id: string;
  fullName: string;
  email: string;
  jobTitle: string;
  department: string;
  country: string;
  currency: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  hireDate: string;
  createdAt: string;
  updatedAt: string;
}

/** HR Managers only: the directory fields plus the salary in integer minor units. */
export interface EmployeeFull extends EmployeeDirectory {
  salary: number;
}

export type EmployeeFor<R extends Role> = R extends 'HR_MANAGER' ? EmployeeFull : EmployeeDirectory;

// Insights (aggregated pay statistics). Money is integer minor units of `currency`;
// in the USD view it is US cents, computed from a static rate table and approximate.

export type InsightView = 'native' | 'usd';

export interface InsightMeta {
  view: InsightView;
  /** True for the USD view: static illustrative rates, never live FX. */
  approximate: boolean;
  /** USD view only: employees left out because their currency has no rate in the table. */
  excludedHeadcount: number;
}

export interface InsightStatsRow {
  key: string;
  currency: string;
  headcount: number;
  min: number;
  p25: number;
  median: number;
  avg: number;
  p75: number;
  max: number;
}

export interface InsightStats extends InsightMeta {
  rows: InsightStatsRow[];
  /** Groups left out because a VIEWER may not see groups this small. 0 for HR_MANAGER. */
  suppressedGroups: number;
}

export interface HeadcountRow {
  key: string;
  headcount: number;
}

export interface SalaryBandBucket {
  from: number;
  to: number;
  count: number;
}

export interface SalaryBands extends InsightMeta {
  currency: string;
  headcount: number;
  buckets: SalaryBandBucket[];
  /** True when a VIEWER asked about a set too small to show; buckets are then empty. */
  suppressed: boolean;
}

export type TenureBandLabel = '<1y' | '1-3y' | '3-5y' | '5-10y' | '10y+';

export interface TenureBand {
  band: TenureBandLabel;
  currency: string;
  headcount: number;
  median: number;
  avg: number;
}

export interface TenureSummary extends InsightMeta {
  bands: TenureBand[];
  suppressedGroups: number;
}

export interface OutlierRow {
  id: string;
  fullName: string;
  jobTitle: string;
  country: string;
  currency: string;
  employmentType: EmployeeDirectory['employmentType'];
  salary: number;
  groupMedian: number;
  /** (salary - groupMedian) / groupMedian, as a percentage. */
  deviationPct: number;
  groupSize: number;
}

export interface OutlierList {
  /** All employees outside their group's fences, before the limit is applied. */
  total: number;
  rows: OutlierRow[];
}
