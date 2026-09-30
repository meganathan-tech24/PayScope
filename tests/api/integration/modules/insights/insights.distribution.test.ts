import type { Express } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '@api/app/app.js';
import { seedEmployees, withSalaries } from '@tests/factories/employee-row.js';
import { hrAuth, viewerAuth } from '@tests/helpers/tokens.js';

const API = '/api/v1/insights';

let app: Express;
beforeEach(() => {
  app = createApp();
});

const get = (path: string, query: Record<string, unknown> = {}, auth = hrAuth) =>
  request(app).get(`${API}${path}`).set('Authorization', auth).query(query);

describe('GET /insights/headcount (integration)', () => {
  beforeEach(async () => {
    await seedEmployees([
      ...withSalaries({ country: 'GB', currency: 'GBP', jobTitle: 'Engineer' }, [1, 2, 3]),
      ...withSalaries(
        { country: 'GB', currency: 'GBP', jobTitle: 'Analyst', employmentType: 'CONTRACT' },
        [1],
      ),
      ...withSalaries({ country: 'US', currency: 'USD', jobTitle: 'Engineer' }, [1, 2]),
    ]);
  });

  it('requires a token', async () => {
    expect((await request(app).get(`${API}/headcount`)).status).toBe(401);
  });

  it('counts by country, largest first', async () => {
    const response = await get('/headcount');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      { key: 'GB', headcount: 4 },
      { key: 'US', headcount: 2 },
    ]);
  });

  it('counts by job title and by employment type, with filters', async () => {
    const byTitle = await get('/headcount', { by: 'jobTitle', country: 'GB' });
    const byType = await get('/headcount', { by: 'employmentType' });

    expect(byTitle.body.data).toEqual([
      { key: 'Engineer', headcount: 3 },
      { key: 'Analyst', headcount: 1 },
    ]);
    expect(byType.body.data).toEqual([
      { key: 'FULL_TIME', headcount: 5 },
      { key: 'CONTRACT', headcount: 1 },
    ]);
  });

  it('rejects an unknown grouping with 400 (salary is not a grouping)', async () => {
    expect((await get('/headcount', { by: 'salary' })).status).toBe(400);
  });

  it('is available to a VIEWER and carries no salary data', async () => {
    const response = await get('/headcount', {}, viewerAuth);

    expect(response.status).toBe(200);
    expect(response.text).not.toContain('salary');
  });
});

describe('GET /insights/salary-bands (integration)', () => {
  const tenGbp = withSalaries(
    { country: 'GB', currency: 'GBP', jobTitle: 'Engineer' },
    [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000],
  );

  it('requires a token, and a currency so bands never mix currencies', async () => {
    expect((await request(app).get(`${API}/salary-bands`)).status).toBe(401);
    expect((await get('/salary-bands')).status).toBe(400);
  });

  it('builds hand-checked buckets for one currency and ignores other currencies', async () => {
    await seedEmployees([
      ...tenGbp,
      ...withSalaries({ country: 'US', currency: 'USD', jobTitle: 'Engineer' }, [999999]),
    ]);

    const response = await get('/salary-bands', { currency: 'gbp', buckets: 5 });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      view: 'native',
      approximate: false,
      excludedHeadcount: 0,
      currency: 'GBP',
      headcount: 10,
      suppressed: false,
      buckets: [
        { from: 1000, to: 2801, count: 2 },
        { from: 2801, to: 4601, count: 2 },
        { from: 4601, to: 6401, count: 2 },
        { from: 6401, to: 8201, count: 2 },
        { from: 8201, to: 10000, count: 2 },
      ],
    });
  });

  it('puts every employee in exactly one bucket and defaults to 10 buckets', async () => {
    await seedEmployees(tenGbp);

    const { buckets } = (await get('/salary-bands', { currency: 'GBP' })).body.data;

    expect(buckets).toHaveLength(10);
    expect(buckets.reduce((sum: number, bucket: { count: number }) => sum + bucket.count, 0)).toBe(
      10,
    );
  });

  it('uses a single bucket when everyone earns the same', async () => {
    await seedEmployees(
      withSalaries(
        { country: 'GB', currency: 'GBP', jobTitle: 'X' },
        [5000, 5000, 5000, 5000, 5000],
      ),
    );

    const response = await get('/salary-bands', { currency: 'GBP' });

    expect(response.body.data.buckets).toEqual([{ from: 5000, to: 5000, count: 5 }]);
  });

  it('returns an empty result, not an error, for a currency nobody is paid in', async () => {
    const response = await get('/salary-bands', { currency: 'JPY' });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ headcount: 0, buckets: [], suppressed: false });
  });

  it('rejects bad bucket counts with 400', async () => {
    expect((await get('/salary-bands', { currency: 'GBP', buckets: 1 })).status).toBe(400);
    expect((await get('/salary-bands', { currency: 'GBP', buckets: 31 })).status).toBe(400);
  });

  it('shows a VIEWER a large enough set, and suppresses one under 5 (HR still sees it)', async () => {
    await seedEmployees([
      ...tenGbp,
      ...withSalaries({ country: 'DE', currency: 'EUR', jobTitle: 'Engineer' }, [100, 900, 500]),
    ]);

    const large = await get('/salary-bands', { currency: 'GBP' }, viewerAuth);
    const small = await get('/salary-bands', { currency: 'EUR' }, viewerAuth);
    const smallForHr = await get('/salary-bands', { currency: 'EUR' }, hrAuth);

    expect(large.body.data.buckets).toHaveLength(10);
    expect(small.body.data).toMatchObject({ headcount: 0, buckets: [], suppressed: true });
    expect(JSON.stringify(small.body.data)).not.toMatch(/100|900|500/);
    expect(smallForHr.body.data.headcount).toBe(3);
    expect(smallForHr.body.data.buckets.length).toBeGreaterThan(0);
  });
});
