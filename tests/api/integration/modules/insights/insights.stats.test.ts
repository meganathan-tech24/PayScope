import type { Express } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '@api/app/app.js';
import { seedEmployees, withSalaries } from '@tests/factories/employee-row.js';
import { hrAuth, viewerAuth } from '@tests/helpers/tokens.js';

const STATS = '/api/v1/insights/stats';

let app: Express;
beforeEach(async () => {
  app = createApp();
  // Hand-checked dataset (minor units).
  await seedEmployees([
    ...withSalaries(
      { country: 'GB', currency: 'GBP', jobTitle: 'Software Engineer' },
      [1000, 2000, 3000, 4000, 5000],
    ),
    ...withSalaries(
      { country: 'US', currency: 'USD', jobTitle: 'Software Engineer' },
      [10000, 30000],
    ),
    ...withSalaries(
      { country: 'DE', currency: 'EUR', jobTitle: 'Analyst', department: 'Finance' },
      [1000, 2000, 3000],
    ),
    ...withSalaries(
      { country: 'FR', currency: 'EUR', jobTitle: 'Analyst', department: 'Finance' },
      [4000, 5000, 6000],
    ),
  ]);
});

const get = (query: Record<string, unknown> = {}, auth = hrAuth) =>
  request(app).get(STATS).set('Authorization', auth).query(query);

const row = (
  key: string,
  currency: string,
  headcount: number,
  [min, p25, median, avg, p75, max]: number[],
) => ({ key, currency, headcount, min, p25, median, avg, p75, max });

describe('GET /insights/stats (integration)', () => {
  it('requires a token', async () => {
    const response = await request(app).get(STATS);

    expect(response.status).toBe(401);
  });

  it('groups by country per currency with hand-checked statistics', async () => {
    const response = await get();

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      view: 'native',
      approximate: false,
      suppressedGroups: 0,
      rows: [
        row('DE', 'EUR', 3, [1000, 1500, 2000, 2000, 2500, 3000]),
        row('FR', 'EUR', 3, [4000, 4500, 5000, 5000, 5500, 6000]),
        row('GB', 'GBP', 5, [1000, 2000, 3000, 3000, 4000, 5000]),
        row('US', 'USD', 2, [10000, 15000, 20000, 20000, 25000, 30000]),
      ],
    });
  });

  it('never mixes currencies: one job title in two currencies is two rows', async () => {
    const response = await get({ groupBy: 'jobTitle' });

    const engineers = response.body.data.rows.filter(
      (r: { key: string }) => r.key === 'Software Engineer',
    );
    expect(engineers.map((r: { currency: string }) => r.currency)).toEqual(['GBP', 'USD']);
  });

  it('merges countries that share a currency when grouping by job title', async () => {
    const response = await get({ groupBy: 'jobTitle' });

    expect(response.body.data.rows).toContainEqual(
      row('Analyst', 'EUR', 6, [1000, 2250, 3500, 3500, 4750, 6000]),
    );
  });

  it('groups by department', async () => {
    const response = await get({ groupBy: 'department' });

    expect(response.body.data.rows).toContainEqual(
      row('Finance', 'EUR', 6, [1000, 2250, 3500, 3500, 4750, 6000]),
    );
    expect(response.body.data.rows.map((r: { key: string }) => r.key)).toEqual([
      'Engineering',
      'Engineering',
      'Finance',
    ]);
  });

  it('applies filters', async () => {
    const byCountry = await get({ country: 'gb' });
    const byCurrency = await get({ currency: 'EUR' });
    const byTitle = await get({ jobTitle: 'Analyst', country: 'DE' });

    expect(byCountry.body.data.rows.map((r: { key: string }) => r.key)).toEqual(['GB']);
    expect(byCurrency.body.data.rows.map((r: { key: string }) => r.key)).toEqual(['DE', 'FR']);
    expect(byTitle.body.data.rows).toEqual([
      row('DE', 'EUR', 3, [1000, 1500, 2000, 2000, 2500, 3000]),
    ]);
  });

  it('returns no rows, not an error, when nothing matches', async () => {
    const response = await get({ country: 'JP' });

    expect(response.status).toBe(200);
    expect(response.body.data.rows).toEqual([]);
  });

  it.each([
    ['an unknown groupBy', { groupBy: 'salary' }],
    ['an org-wide group in the native view', { groupBy: 'org' }],
    ['an unknown country', { country: 'ZZ' }],
    ['an unknown field', { minSalary: 1 }],
  ])('rejects %s with 400', async (_label, query) => {
    const response = await get(query);

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('treats quotes and punctuation in a filter value as plain data', async () => {
    const response = await get({ jobTitle: "O'Brien; (Sales) -- lead" });

    expect(response.status).toBe(200);
    expect(response.body.data.rows).toEqual([]);
  });
});

describe('GET /insights/stats as a VIEWER (integration)', () => {
  it('hides groups smaller than 5 and says how many were hidden', async () => {
    const response = await get({}, viewerAuth);

    expect(response.status).toBe(200);
    expect(response.body.data.rows.map((r: { key: string }) => r.key)).toEqual(['GB']);
    expect(response.body.data.suppressedGroups).toBe(3);
  });

  it('applies the threshold to the group as filtered, so filters cannot single someone out', async () => {
    const response = await get({ country: 'DE' }, viewerAuth);

    expect(response.body.data.rows).toEqual([]);
    expect(response.body.data.suppressedGroups).toBe(1);
  });

  it('shows a group that is large enough after merging (Analyst in EUR has 6)', async () => {
    const response = await get({ groupBy: 'jobTitle' }, viewerAuth);

    const keys = response.body.data.rows.map((r: { key: string; currency: string }) => [
      r.key,
      r.currency,
    ]);
    expect(keys).toEqual([
      ['Analyst', 'EUR'],
      ['Software Engineer', 'GBP'],
    ]);
    expect(response.body.data.suppressedGroups).toBe(1);
  });

  it('never carries individual data: only aggregate keys', async () => {
    const response = await get({ groupBy: 'jobTitle' }, viewerAuth);

    for (const item of response.body.data.rows) {
      expect(Object.keys(item).sort()).toEqual(
        ['avg', 'currency', 'headcount', 'key', 'max', 'median', 'min', 'p25', 'p75'].sort(),
      );
    }
    expect(response.text).not.toMatch(/fullName|email|"id"/);
  });

  it('still gives an HR_MANAGER every group (regression)', async () => {
    const response = await get({}, hrAuth);

    expect(response.body.data.rows).toHaveLength(4);
    expect(response.body.data.suppressedGroups).toBe(0);
  });
});
