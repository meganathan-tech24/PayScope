import { prisma } from '../../database/prisma.js';
import { Prisma } from '../../generated/prisma/client.js';

import type { InsightFilters } from './insights.schema.js';

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
