import type { Express } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '@api/app/app.js';
import { seedEmployees, withSalaries } from '@tests/factories/employee-row.js';
import { hrAuth, viewerAuth } from '@tests/helpers/tokens.js';

const OUTLIERS = '/api/v1/insights/outliers';

let app: Express;
beforeEach(async () => {
  app = createApp();
  const gb = { country: 'GB', currency: 'GBP', jobTitle: 'Engineer' };
  // Hand-checked: sorted 1000, 5000..5700 (step 100), 9000 -> Q1 5125, median 5350,
  // Q3 5675, IQR 550, fences 4300 and 6500, so 1000 and 9000 are the outliers.
  await seedEmployees([
    ...withSalaries(gb, [5000, 5100, 5200, 5300, 5400, 5500, 5600, 5700]),
    { ...gb, salary: 9000, fullName: 'Outlier High', employmentType: 'CONTRACT' },
    { ...gb, salary: 1000, fullName: 'Outlier Low' },
    // A tight group in another currency, with no outlier.
    ...withSalaries(
      { country: 'DE', currency: 'EUR', jobTitle: 'Engineer' },
      [3000, 3100, 3200, 3300, 3400, 3500, 3600, 3700],
    ),
    // Too small a group to judge, even with an extreme salary.
    ...withSalaries(
      { country: 'US', currency: 'USD', jobTitle: 'Engineer' },
      [100, 100, 100, 100, 900000],
    ),
  ]);
});

const get = (query: Record<string, unknown> = {}, auth = hrAuth) =>
  request(app).get(OUTLIERS).set('Authorization', auth).query(query);

describe('GET /insights/outliers (integration)', () => {
  it('requires a token', async () => {
    expect((await request(app).get(OUTLIERS)).status).toBe(401);
  });

  it('lists employees outside their group fences, largest deviation first', async () => {
    const response = await get();

    expect(response.status).toBe(200);
    expect(response.body.data.total).toBe(2);
    expect(response.body.data.rows).toEqual([
      {
        id: expect.any(String),
        fullName: 'Outlier Low',
        jobTitle: 'Engineer',
        country: 'GB',
        currency: 'GBP',
        employmentType: 'FULL_TIME',
        salary: 1000,
        groupMedian: 5350,
        deviationPct: -81.3,
        groupSize: 10,
      },
      {
        id: expect.any(String),
        fullName: 'Outlier High',
        jobTitle: 'Engineer',
        country: 'GB',
        currency: 'GBP',
        employmentType: 'CONTRACT',
        salary: 9000,
        groupMedian: 5350,
        deviationPct: 68.2,
        groupSize: 10,
      },
    ]);
  });

  it('skips groups under 8 people and never compares across currencies', async () => {
    const rows = (await get()).body.data.rows;

    expect(rows.map((r: { country: string }) => r.country)).not.toContain('US');
    expect(rows.map((r: { country: string }) => r.country)).not.toContain('DE');
  });

  it('limits the list but still reports the total', async () => {
    const response = await get({ limit: 1 });

    expect(response.body.data.rows).toHaveLength(1);
    expect(response.body.data.total).toBe(2);
  });

  it('narrows the list with filters without changing the group statistics', async () => {
    const response = await get({ country: 'GB', jobTitle: 'Engineer', currency: 'GBP' });
    const none = await get({ country: 'DE' });

    expect(response.body.data.total).toBe(2);
    expect(response.body.data.rows[0].groupMedian).toBe(5350);
    expect(none.body.data).toEqual({ total: 0, rows: [] });
  });

  it.each([{ limit: 0 }, { limit: 101 }, { threshold: 2 }, { country: 'ZZ' }])(
    'rejects %j with 400',
    async (query) => {
      expect((await get(query)).status).toBe(400);
    },
  );

  it('is forbidden for a VIEWER (403) and returns no employee data', async () => {
    const response = await get({}, viewerAuth);

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('FORBIDDEN');
    expect(response.text).not.toMatch(/Outlier|fullName|salary/);
  });

  it('is forbidden for a VIEWER whatever the parameters, even invalid ones', async () => {
    expect((await get({ limit: 0 }, viewerAuth)).status).toBe(403);
  });
});
