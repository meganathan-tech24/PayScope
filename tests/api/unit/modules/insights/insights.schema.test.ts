import { describe, expect, it } from 'vitest';

import {
  headcountQuerySchema,
  outliersQuerySchema,
  salaryBandsQuerySchema,
  statsQuerySchema,
  tenureQuerySchema,
} from '@api/modules/insights/insights.schema.js';

describe('statsQuerySchema', () => {
  it('defaults to grouping by country in the native view', () => {
    expect(statsQuerySchema.parse({})).toEqual({ groupBy: 'country', view: 'native' });
  });

  it.each(['country', 'jobTitle', 'department'])('accepts groupBy=%s', (groupBy) => {
    expect(statsQuerySchema.parse({ groupBy }).groupBy).toBe(groupBy);
  });

  it('rejects an unknown groupBy, so no column name can come from the client', () => {
    expect(statsQuerySchema.safeParse({ groupBy: 'salary' }).success).toBe(false);
    expect(statsQuerySchema.safeParse({ groupBy: 'not_a_column' }).success).toBe(false);
  });

  it('only allows an org-wide group in the USD view (it would mix currencies)', () => {
    expect(statsQuerySchema.safeParse({ groupBy: 'org' }).success).toBe(false);
    expect(statsQuerySchema.safeParse({ groupBy: 'org', view: 'usd' }).success).toBe(true);
  });

  it('normalizes filters and treats blank ones as absent', () => {
    const parsed = statsQuerySchema.parse({ country: ' gb ', currency: 'gbp', department: '' });

    expect(parsed).toMatchObject({ country: 'GB', currency: 'GBP' });
    expect(parsed.department).toBeUndefined();
  });

  it.each([{ country: 'ZZ' }, { currency: 'XYZ' }, { view: 'eur' }, { unknown: 1 }])(
    'rejects %j',
    (query) => {
      expect(statsQuerySchema.safeParse(query).success).toBe(false);
    },
  );
});

describe('headcountQuerySchema', () => {
  it('defaults to country and accepts the whitelisted fields only', () => {
    expect(headcountQuerySchema.parse({}).by).toBe('country');
    expect(headcountQuerySchema.parse({ by: 'employmentType' }).by).toBe('employmentType');
    expect(headcountQuerySchema.safeParse({ by: 'salary' }).success).toBe(false);
  });
});

describe('salaryBandsQuerySchema', () => {
  it('needs a currency in the native view, so bands never mix currencies', () => {
    expect(salaryBandsQuerySchema.safeParse({}).success).toBe(false);
    expect(salaryBandsQuerySchema.parse({ currency: 'GBP' }).buckets).toBe(10);
  });

  it('needs no currency in the USD view and rejects one', () => {
    expect(salaryBandsQuerySchema.safeParse({ view: 'usd' }).success).toBe(true);
    expect(salaryBandsQuerySchema.safeParse({ view: 'usd', currency: 'GBP' }).success).toBe(false);
  });

  it.each([1, 31, 2.5, 'ten'])('rejects buckets=%s', (buckets) => {
    expect(salaryBandsQuerySchema.safeParse({ currency: 'GBP', buckets }).success).toBe(false);
  });

  it.each([2, 30])('accepts buckets=%s', (buckets) => {
    expect(salaryBandsQuerySchema.parse({ currency: 'GBP', buckets }).buckets).toBe(buckets);
  });
});

describe('tenureQuerySchema and outliersQuerySchema', () => {
  it('default to the native view and a limit of 50', () => {
    expect(tenureQuerySchema.parse({}).view).toBe('native');
    expect(outliersQuerySchema.parse({}).limit).toBe(50);
  });

  it.each([0, 101, 'many'])('rejects limit=%s', (limit) => {
    expect(outliersQuerySchema.safeParse({ limit }).success).toBe(false);
  });
});
