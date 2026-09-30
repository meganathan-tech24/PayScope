import type { TenureBand } from '@payscope/types';

import { prisma } from '../../database/prisma.js';
import { Prisma } from '../../generated/prisma/client.js';

import type { HEADCOUNT_BY, InsightFilters } from './insights.schema.js';

// Raw SQL is parameterised: values are always bound parameters. The only
// interpolated fragments are these fixed identifiers, chosen from a whitelist by
// key, never built from request input.
const GROUP_COLUMN = {
  country: Prisma.raw('e."country"'),
  jobTitle: Prisma.raw('e."jobTitle"'),
  department: Prisma.raw('e."department"'),
} as const;

export type GroupColumn = keyof typeof GROUP_COLUMN;

export function whereClause(filters: InsightFilters): Prisma.Sql {
  const conditions: Prisma.Sql[] = [];
  if (filters.country) conditions.push(Prisma.sql`e."country" = ${filters.country}`);
  if (filters.currency) conditions.push(Prisma.sql`e."currency" = ${filters.currency}`);
  if (filters.department) conditions.push(Prisma.sql`e."department" = ${filters.department}`);
  if (filters.jobTitle) conditions.push(Prisma.sql`e."jobTitle" = ${filters.jobTitle}`);
  return conditions.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
    : Prisma.empty;
}

interface RawStatsRow {
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

// Counts are cast to int and money to float8 so the driver returns plain numbers
// (no BigInt); money is rounded to whole minor units in JS.
export async function getStats(
  groupBy: GroupColumn,
  filters: InsightFilters,
): Promise<RawStatsRow[]> {
  const column = GROUP_COLUMN[groupBy];
  const rows = await prisma.$queryRaw<RawStatsRow[]>(Prisma.sql`
    SELECT ${column} AS "key",
           e."currency" AS "currency",
           COUNT(*)::int AS "headcount",
           MIN(e."salary")::float8 AS "min",
           percentile_cont(0.25) WITHIN GROUP (ORDER BY e."salary") AS "p25",
           percentile_cont(0.5) WITHIN GROUP (ORDER BY e."salary") AS "median",
           AVG(e."salary")::float8 AS "avg",
           percentile_cont(0.75) WITHIN GROUP (ORDER BY e."salary") AS "p75",
           MAX(e."salary")::float8 AS "max"
    FROM "Employee" e
    ${whereClause(filters)}
    GROUP BY ${column}, e."currency"
    ORDER BY ${column}, e."currency"`);

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

const HEADCOUNT_COLUMN: Record<(typeof HEADCOUNT_BY)[number], Prisma.Sql> = {
  country: GROUP_COLUMN.country,
  jobTitle: GROUP_COLUMN.jobTitle,
  department: GROUP_COLUMN.department,
  employmentType: Prisma.raw('e."employmentType"::text'),
};

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
): Promise<{ headcount: number; min: number; max: number }> {
  const [row] = await prisma.$queryRaw<
    { headcount: number; min: number | null; max: number | null }[]
  >(
    Prisma.sql`
      SELECT COUNT(*)::int AS "headcount",
             MIN(e."salary")::float8 AS "min",
             MAX(e."salary")::float8 AS "max"
      FROM "Employee" e
      ${whereClause(filters)}`,
  );
  return { headcount: row?.headcount ?? 0, min: row?.min ?? 0, max: row?.max ?? 0 };
}

// Counts per equal-width bucket over [min, max + 1); the +1 puts the maximum in the last bucket.
export async function getBucketCounts(
  filters: InsightFilters,
  min: number,
  max: number,
  buckets: number,
): Promise<Map<number, number>> {
  const rows = await prisma.$queryRaw<{ bucket: number; count: number }[]>(Prisma.sql`
    SELECT width_bucket(e."salary"::float8, ${min}::float8, ${max + 1}::float8, ${buckets}::int) AS "bucket",
           COUNT(*)::int AS "count"
    FROM "Employee" e
    ${whereClause(filters)}
    GROUP BY 1`);
  return new Map(rows.map((row) => [row.bucket, row.count]));
}

// Tenure in years is the whole-day difference from `asOf` (a YYYY-MM-DD date the
// service supplies, so tests never depend on the database clock) over 365.25.
export async function getTenureBands(filters: InsightFilters, asOf: string): Promise<TenureBand[]> {
  const rows = await prisma.$queryRaw<TenureBand[]>(Prisma.sql`
    SELECT t."band" AS "band",
           t."currency" AS "currency",
           COUNT(*)::int AS "headcount",
           percentile_cont(0.5) WITHIN GROUP (ORDER BY t."salary") AS "median",
           AVG(t."salary")::float8 AS "avg"
    FROM (
      SELECT e."salary", e."currency", e."hireDate",
             CASE
               WHEN (${asOf}::date - e."hireDate") / 365.25 < 1 THEN '<1y'
               WHEN (${asOf}::date - e."hireDate") / 365.25 < 3 THEN '1-3y'
               WHEN (${asOf}::date - e."hireDate") / 365.25 < 5 THEN '3-5y'
               WHEN (${asOf}::date - e."hireDate") / 365.25 < 10 THEN '5-10y'
               ELSE '10y+'
             END AS "band"
      FROM "Employee" e
      ${whereClause(filters)}
    ) t
    GROUP BY t."band", t."currency"
    ORDER BY t."currency",
             CASE t."band" WHEN '<1y' THEN 1 WHEN '1-3y' THEN 2 WHEN '3-5y' THEN 3 WHEN '5-10y' THEN 4 ELSE 5 END`);

  return rows.map((row) => ({ ...row, median: Math.round(row.median), avg: Math.round(row.avg) }));
}
