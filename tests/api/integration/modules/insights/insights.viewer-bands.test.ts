import type { Express } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { createApp } from '@api/app/app.js';
import { seedEmployees, withSalaries } from '@tests/factories/employee-row.js';
import { hrAuth, viewerAuth } from '@tests/helpers/tokens.js';

const BANDS = '/api/v1/insights/salary-bands';

// Awkward salaries on purpose (minor units): none is a multiple of any band width.
const SALARIES = [1_234_567, 3_456_789, 4_567_891, 6_789_012, 9_876_543, 11_223_345];
const MIN = 1_234_567;
const MAX = 11_223_345;

// Strict: any key the API adds without this test knowing about it fails the parse.
const viewerBandsSchema = z
  .object({
    view: z.literal('native'),
    approximate: z.literal(false),
    excludedHeadcount: z.number(),
    currency: z.string(),
    headcount: z.number(),
    suppressed: z.literal(false),
    bucketWidth: z.number().int().positive(),
    buckets: z.array(z.object({ from: z.number(), to: z.number(), count: z.number() }).strict()),
  })
  .strict();

let app: Express;
beforeEach(() => {
  app = createApp();
});

const get = (query: Record<string, unknown>, auth: string) =>
  request(app).get(BANDS).set('Authorization', auth).query(query);

const gbp = (salaries: number[]) =>
  seedEmployees(withSalaries({ country: 'GB', currency: 'GBP', jobTitle: 'Engineer' }, salaries));

describe('salary bands for a VIEWER: fixed, rounded edges', () => {
  it('parses strictly, and every edge is a multiple of the band width', async () => {
    await gbp(SALARIES);

    const response = await get({ currency: 'GBP' }, viewerAuth);

    expect(response.status).toBe(200);
    const bands = viewerBandsSchema.parse(response.body.data);
    expect(bands.bucketWidth).toBe(2_000_000); // 20,000 pounds
    expect(bands.buckets).toHaveLength(6);
    for (const bucket of bands.buckets) {
      expect(bucket.from % bands.bucketWidth).toBe(0);
      expect(bucket.to % bands.bucketWidth).toBe(0);
      expect(bucket.to - bucket.from).toBe(bands.bucketWidth);
    }
    expect(bands.buckets.map((b) => b.count)).toEqual([1, 1, 1, 1, 1, 1]);
    expect(bands.buckets.reduce((sum, b) => sum + b.count, 0)).toBe(SALARIES.length);
  });

  it('never contains an individual salary, in any form, anywhere in the response', async () => {
    await gbp(SALARIES);

    const response = await get({ currency: 'GBP' }, viewerAuth);

    for (const salary of SALARIES) {
      expect(response.text).not.toContain(String(salary));
    }
    expect(JSON.stringify(response.body.data)).not.toMatch(/"(min|max)"/);
    const { buckets } = response.body.data;
    expect(buckets[0].from).toBeLessThanOrEqual(MIN);
    expect(buckets[0].from).not.toBe(MIN);
    expect(buckets.at(-1).to).toBeGreaterThan(MAX);
    expect(buckets.at(-1).to).not.toBe(MAX);
  });

  it('covers the whole range but never uses the real minimum or maximum as an edge', async () => {
    await gbp(SALARIES);

    const { buckets } = (await get({ currency: 'GBP' }, viewerAuth)).body.data;
    const edges = buckets.flatMap((b: { from: number; to: number }) => [b.from, b.to]);

    expect(edges).not.toContain(MIN);
    expect(edges).not.toContain(MAX);
  });

  it('widens the step, still on round edges, when the range needs more bands than requested', async () => {
    await gbp([500_001, 400_000_001, 1_900_000_003, 900_000_007, 1_200_000_011]);

    const response = await get({ currency: 'GBP', buckets: 5 }, viewerAuth);

    const bands = viewerBandsSchema.parse(response.body.data);
    expect(bands.buckets.length).toBeLessThanOrEqual(5);
    expect(bands.bucketWidth).toBeGreaterThan(2_000_000);
    for (const bucket of bands.buckets) {
      expect(bucket.from % bands.bucketWidth).toBe(0);
    }
    expect(bands.buckets.reduce((sum, b) => sum + b.count, 0)).toBe(5);
  });

  it('uses a step in US cents in the approximate USD view', async () => {
    await gbp(SALARIES);

    const response = await get({ view: 'usd' }, viewerAuth);

    expect(response.body.data).toMatchObject({ view: 'usd', currency: 'USD', approximate: true });
    expect(response.body.data.bucketWidth).toBe(2_500_000);
    for (const bucket of response.body.data.buckets) {
      expect(bucket.from % 2_500_000).toBe(0);
    }
  });

  it('still hides a set of fewer than 5 people, with no numbers at all', async () => {
    await gbp(SALARIES.slice(0, 4));

    const response = await get({ currency: 'GBP' }, viewerAuth);

    expect(response.body.data).toMatchObject({ headcount: 0, buckets: [], suppressed: true });
    expect(response.body.data).not.toHaveProperty('bucketWidth');
    for (const salary of SALARIES) expect(response.text).not.toContain(String(salary));
  });
});

describe('salary bands for an HR manager: unchanged', () => {
  it('still starts at the exact minimum and ends at the exact maximum, with no band width key', async () => {
    await gbp(SALARIES);

    const response = await get({ currency: 'GBP', buckets: 5 }, hrAuth);

    const { buckets } = response.body.data;
    expect(buckets[0].from).toBe(MIN);
    expect(buckets.at(-1).to).toBe(MAX);
    expect(buckets).toHaveLength(5);
    expect(response.body.data).not.toHaveProperty('bucketWidth');
  });

  it('is not suppressed for a small set, as before', async () => {
    await gbp(SALARIES.slice(0, 3));

    const response = await get({ currency: 'GBP' }, hrAuth);

    expect(response.body.data.suppressed).toBe(false);
    expect(response.body.data.headcount).toBe(3);
  });
});
