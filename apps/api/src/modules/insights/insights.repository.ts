import { usdConversionTable } from '@payscope/shared';
import type { InsightStatsRow, InsightView, OutlierRow, TenureBand } from '@payscope/types';

import { prisma } from '../../database/prisma.js';
import { Prisma } from '../../generated/prisma/client.js';

import type { HEADCOUNT_BY, InsightFilters } from './insights.schema.js';

// Raw SQL is parameterised: values are always bound parameters. The only
// interpolated fragments are fixed identifiers and expressions chosen from a
// whitelist by key, never built from request input.
const GROUP_COLUMN = {
  country: Prisma.raw('e."country"'),
  jobTitle: Prisma.raw('e."jobTitle"'),
  department: Prisma.raw('e."department"'),
  org: Prisma.raw(`'All employees'::text`),
} as const;

export type GroupColumn = keyof typeof GROUP_COLUMN;

const HEADCOUNT_COLUMN: Record<(typeof HEADCOUNT_BY)[number], Prisma.Sql> = {
  country: GROUP_COLUMN.country,
  jobTitle: GROUP_COLUMN.jobTitle,
  department: GROUP_COLUMN.department,
  employmentType: Prisma.raw('e."employmentType"::text'),
};

// Where salary and currency come from. Native reads the stored values; the USD view
// joins the static rate table (passed as bound arrays) and converts to US cents.
// An employee whose currency has no rate is not joined, and is counted separately.
export interface SalarySource {
  withClause: Prisma.Sql;
  from: Prisma.Sql;
  salary: Prisma.Sql;
  currency: Prisma.Sql;
}

export function salarySource(view: InsightView): SalarySource {
  if (view === 'native') {
    return {
      withClause: Prisma.empty,
      from: Prisma.sql`"Employee" e`,
      salary: Prisma.sql`e."salary"`,
      currency: Prisma.sql`e."currency"`,
    };
  }
  const { currencies, divisors } = usdConversionTable();
  return {
    withClause: Prisma.sql`WITH "rates" AS (
      SELECT * FROM unnest(${currencies}::text[], ${divisors}::float8[]) AS r("currency", "divisor")
    )`,
    from: Prisma.sql`"Employee" e JOIN "rates" r ON r."currency" = e."currency"`,
    salary: Prisma.sql`(e."salary"::float8 * 100 / r."divisor")`,
    currency: Prisma.sql`'USD'::text`,
  };
}

function filterConditions(filters: InsightFilters): Prisma.Sql[] {
  const conditions: Prisma.Sql[] = [];
  if (filters.country) conditions.push(Prisma.sql`e."country" = ${filters.country}`);
  if (filters.currency) conditions.push(Prisma.sql`e."currency" = ${filters.currency}`);
  if (filters.department) conditions.push(Prisma.sql`e."department" = ${filters.department}`);
  if (filters.jobTitle) conditions.push(Prisma.sql`e."jobTitle" = ${filters.jobTitle}`);
  return conditions;
}

export function whereClause(filters: InsightFilters): Prisma.Sql {
  const conditions = filterConditions(filters);
  return conditions.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
    : Prisma.empty;
}

// Counts are cast to int and money to float8 so the driver returns plain numbers
// (no BigInt); money is rounded to whole minor units in JS.
export async function getStats(
  groupBy: GroupColumn,
  filters: InsightFilters,
  source: SalarySource,
): Promise<InsightStatsRow[]> {
  const column = GROUP_COLUMN[groupBy];
  const rows = await prisma.$queryRaw<InsightStatsRow[]>(Prisma.sql`
    ${source.withClause}
    SELECT ${column} AS "key",
           ${source.currency} AS "currency",
           COUNT(*)::int AS "headcount",
           MIN(${source.salary})::float8 AS "min",
           percentile_cont(0.25) WITHIN GROUP (ORDER BY ${source.salary}) AS "p25",
           percentile_cont(0.5) WITHIN GROUP (ORDER BY ${source.salary}) AS "median",
           AVG(${source.salary})::float8 AS "avg",
           percentile_cont(0.75) WITHIN GROUP (ORDER BY ${source.salary}) AS "p75",
           MAX(${source.salary})::float8 AS "max"
    FROM ${source.from}
    ${whereClause(filters)}
    GROUP BY 1, 2
    ORDER BY 1, 2`);

  return rows.map((row) => ({
    ...row,
    min: Math.round(row.min),
    p25: Math.round(row.p25),
    median: Math.round(row.median),
    avg: Math.round(row.avg),
    p75: Math.round(row.p75),
    max: Math.round(row.max),
  }));
}

export function getHeadcount(
  by: (typeof HEADCOUNT_BY)[number],
  filters: InsightFilters,
): Promise<{ key: string; headcount: number }[]> {
  const column = HEADCOUNT_COLUMN[by];
  return prisma.$queryRaw(Prisma.sql`
    SELECT ${column} AS "key", COUNT(*)::int AS "headcount"
    FROM "Employee" e
    ${whereClause(filters)}
    GROUP BY ${column}
    ORDER BY "headcount" DESC, "key"`);
}

export async function getSalaryRange(
  filters: InsightFilters,
  source: SalarySource,
): Promise<{ headcount: number; min: number; max: number }> {
  const [row] = await prisma.$queryRaw<
    { headcount: number; min: number | null; max: number | null }[]
  >(Prisma.sql`
    ${source.withClause}
    SELECT COUNT(*)::int AS "headcount",
           MIN(${source.salary})::float8 AS "min",
           MAX(${source.salary})::float8 AS "max"
    FROM ${source.from}
    ${whereClause(filters)}`);
  return {
    headcount: row?.headcount ?? 0,
    min: Math.round(row?.min ?? 0),
    max: Math.round(row?.max ?? 0),
  };
}

// Counts per equal-width bucket over [min, max + 1); the +1 puts the maximum in the last bucket.
export async function getBucketCounts(
  filters: InsightFilters,
  source: SalarySource,
  min: number,
  max: number,
  buckets: number,
): Promise<Map<number, number>> {
  const rows = await prisma.$queryRaw<{ bucket: number; count: number }[]>(Prisma.sql`
    ${source.withClause}
    SELECT width_bucket(${source.salary}, ${min}::float8, ${max + 1}::float8, ${buckets}::int) AS "bucket",
           COUNT(*)::int AS "count"
    FROM ${source.from}
    ${whereClause(filters)}
    GROUP BY 1`);
  return new Map(rows.map((row) => [row.bucket, row.count]));
}

// Tenure in years is the whole-day difference from `asOf` (a YYYY-MM-DD date the
// service supplies, so tests never depend on the database clock) over 365.25.
export async function getTenureBands(
  filters: InsightFilters,
  source: SalarySource,
  asOf: string,
): Promise<TenureBand[]> {
  const rows = await prisma.$queryRaw<TenureBand[]>(Prisma.sql`
    ${source.withClause}
    SELECT t."band" AS "band",
           t."currency" AS "currency",
           COUNT(*)::int AS "headcount",
           percentile_cont(0.5) WITHIN GROUP (ORDER BY t."salary") AS "median",
           AVG(t."salary")::float8 AS "avg"
    FROM (
      SELECT ${source.salary} AS "salary", ${source.currency} AS "currency",
             CASE
               WHEN (${asOf}::date - e."hireDate") / 365.25 < 1 THEN '<1y'
               WHEN (${asOf}::date - e."hireDate") / 365.25 < 3 THEN '1-3y'
               WHEN (${asOf}::date - e."hireDate") / 365.25 < 5 THEN '3-5y'
               WHEN (${asOf}::date - e."hireDate") / 365.25 < 10 THEN '5-10y'
               ELSE '10y+'
             END AS "band"
      FROM ${source.from}
      ${whereClause(filters)}
    ) t
    GROUP BY t."band", t."currency"
    ORDER BY t."currency",
             CASE t."band" WHEN '<1y' THEN 1 WHEN '1-3y' THEN 2 WHEN '3-5y' THEN 3 WHEN '5-10y' THEN 4 ELSE 5 END`);

  return rows.map((row) => ({ ...row, median: Math.round(row.median), avg: Math.round(row.avg) }));
}

// USD view: employees whose currency is not in the rate table, so the view can say
// how many were left out instead of dropping them silently.
export async function countWithoutRate(filters: InsightFilters): Promise<number> {
  const { currencies } = usdConversionTable();
  const [row] = await prisma.$queryRaw<{ count: number }[]>(Prisma.sql`
    SELECT COUNT(*)::int AS "count"
    FROM "Employee" e
    ${whereClause(filters)}
    ${filters.country || filters.currency || filters.department || filters.jobTitle ? Prisma.sql`AND` : Prisma.sql`WHERE`}
    e."currency" <> ALL(${currencies}::text[])`);
  return row?.count ?? 0;
}

// A group needs at least this many people for quartiles to mean anything.
export const MIN_OUTLIER_GROUP_SIZE = 8;

// Tukey fences per (country, currency, jobTitle) group: outside Q1 - 1.5 IQR or
// Q3 + 1.5 IQR. Group statistics are always computed over the whole group; the
// filters only narrow which outliers are listed.
export async function getOutliers(
  filters: InsightFilters,
  limit: number,
): Promise<{ total: number; rows: OutlierRow[] }> {
  const conditions = [
    Prisma.sql`(e."salary" < s."q1" - 1.5 * (s."q3" - s."q1") OR e."salary" > s."q3" + 1.5 * (s."q3" - s."q1"))`,
    ...filterConditions(filters),
  ];
  const rows = await prisma.$queryRaw<(Omit<OutlierRow, 'deviationPct'> & { total: number })[]>(
    Prisma.sql`
    WITH s AS (
      SELECT e."country", e."currency", e."jobTitle",
             COUNT(*)::int AS "n",
             percentile_cont(0.25) WITHIN GROUP (ORDER BY e."salary") AS "q1",
             percentile_cont(0.5) WITHIN GROUP (ORDER BY e."salary") AS "median",
             percentile_cont(0.75) WITHIN GROUP (ORDER BY e."salary") AS "q3"
      FROM "Employee" e
      GROUP BY e."country", e."currency", e."jobTitle"
      HAVING COUNT(*) >= ${MIN_OUTLIER_GROUP_SIZE}
    )
    SELECT e."id", e."fullName", e."jobTitle", e."country", e."currency", e."employmentType",
           e."salary", s."median"::float8 AS "groupMedian", s."n" AS "groupSize",
           COUNT(*) OVER ()::int AS "total"
    FROM "Employee" e
    JOIN s ON s."country" = e."country" AND s."currency" = e."currency" AND s."jobTitle" = e."jobTitle"
    WHERE ${Prisma.join(conditions, ' AND ')}
    ORDER BY ABS(e."salary" - s."median") / NULLIF(s."median", 0) DESC, e."id"
    LIMIT ${limit}`,
  );

  return {
    total: rows[0]?.total ?? 0,
    rows: rows.map(({ total: _total, groupMedian, ...row }) => ({
      ...row,
      groupMedian: Math.round(groupMedian),
      deviationPct:
        groupMedian === 0 ? 0 : Math.round(((row.salary - groupMedian) / groupMedian) * 1000) / 10,
    })),
  };
}
