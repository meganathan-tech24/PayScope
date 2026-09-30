import type { Express } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '@api/app/app.js';
import { seedEmployees } from '@tests/factories/employee-row.js';
import { hrAuth, viewerAuth } from '@tests/helpers/tokens.js';

const API = '/api/v1/insights';
const yearsAgo = (years: number): string =>
  new Date(Date.now() - years * 365.25 * 86_400_000).toISOString().slice(0, 10);

let app: Express;
beforeEach(async () => {
  app = createApp();
  // Each salary is hand-converted with the static rates (GBP 0.78, EUR 0.92, INR 84,
  // JPY 150, USD 1; JPY has no minor units). Expected US cents in the comments.
  const at = { hireDate: yearsAgo(7), jobTitle: 'Engineer' };
  await seedEmployees([
    { ...at, country: 'GB', currency: 'GBP', salary: 3_900_000 }, // 39,000 GBP -> 5,000,000
    { ...at, country: 'JP', currency: 'JPY', salary: 7_500_000 }, // 7.5M JPY   -> 5,000,000
    { ...at, country: 'US', currency: 'USD', salary: 10_000_000 }, // -> 10,000,000
    { ...at, country: 'DE', currency: 'EUR', salary: 9_200_000 }, // 92,000 EUR -> 10,000,000
    { ...at, country: 'IN', currency: 'INR', salary: 1_680_000_000 }, // 16.8M INR -> 20,000,000
  ]);
});

const get = (path: string, query: Record<string, unknown> = {}, auth = hrAuth) =>
  request(app).get(`${API}${path}`).set('Authorization', auth).query(query);

describe('USD view (integration)', () => {
  it('gives one org-wide row in US cents, labelled approximate', async () => {
    const response = await get('/stats', { groupBy: 'org', view: 'usd' });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      view: 'usd',
      approximate: true,
      excludedHeadcount: 0,
      suppressedGroups: 0,
      rows: [
        {
          key: 'All employees',
          currency: 'USD',
          headcount: 5,
          min: 5_000_000,
          p25: 5_000_000,
          median: 10_000_000,
          avg: 10_000_000,
          p75: 10_000_000,
          max: 20_000_000,
        },
      ],
    });
  });

  it('converts each country into USD when grouping by country', async () => {
    const response = await get('/stats', { view: 'usd' });

    const medians = Object.fromEntries(
      response.body.data.rows.map((r: { key: string; median: number }) => [r.key, r.median]),
    );
    expect(medians).toEqual({
      DE: 10_000_000,
      GB: 5_000_000,
      IN: 20_000_000,
      JP: 5_000_000,
      US: 10_000_000,
    });
  });

  it('says how many employees have no rate instead of dropping them silently', async () => {
    await seedEmployees([
      { country: 'CH', currency: 'CHF', jobTitle: 'Engineer', salary: 9_000_000 },
    ]);

    const response = await get('/stats', { groupBy: 'org', view: 'usd' });

    expect(response.body.data.excludedHeadcount).toBe(1);
    expect(response.body.data.rows[0].headcount).toBe(5);
  });

  it('keeps the native view free of conversion', async () => {
    const response = await get('/stats', { groupBy: 'country' });

    expect(response.body.data).toMatchObject({ view: 'native', approximate: false });
    expect(response.body.data.rows.find((r: { key: string }) => r.key === 'JP').median).toBe(
      7_500_000,
    );
  });

  it('builds USD salary bands over the converted range', async () => {
    const response = await get('/salary-bands', { view: 'usd', buckets: 3 });

    expect(response.body.data).toMatchObject({
      view: 'usd',
      approximate: true,
      currency: 'USD',
      headcount: 5,
    });
    const { buckets } = response.body.data;
    expect(buckets[0].from).toBe(5_000_000);
    expect(buckets[buckets.length - 1].to).toBe(20_000_000);
    expect(buckets.reduce((sum: number, b: { count: number }) => sum + b.count, 0)).toBe(5);
  });

  it('summarises tenure in USD', async () => {
    const response = await get('/tenure', { view: 'usd' });

    expect(response.body.data.bands).toEqual([
      { band: '5-10y', currency: 'USD', headcount: 5, median: 10_000_000, avg: 10_000_000 },
    ]);
    expect(response.body.data.approximate).toBe(true);
  });

  it('still hides small groups from a VIEWER in the USD view', async () => {
    const byCountry = await get('/stats', { view: 'usd' }, viewerAuth);
    const org = await get('/stats', { groupBy: 'org', view: 'usd' }, viewerAuth);

    expect(byCountry.body.data.rows).toEqual([]);
    expect(byCountry.body.data.suppressedGroups).toBe(5);
    expect(org.body.data.rows).toHaveLength(1);
  });

  it('rejects mixing a currency filter into USD bands, and org-wide in the native view', async () => {
    expect((await get('/salary-bands', { view: 'usd', currency: 'GBP' })).status).toBe(400);
    expect((await get('/stats', { groupBy: 'org' })).status).toBe(400);
  });
});
