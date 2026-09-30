import type { Express } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '@api/app/app.js';
import { seedEmployees, withSalaries } from '@tests/factories/employee-row.js';
import { hrAuth, viewerAuth } from '@tests/helpers/tokens.js';

const TENURE = '/api/v1/insights/tenure';

// Hire dates relative to today, with months of margin around each band edge, so
// the bands are stable whenever the suite runs.
const yearsAgo = (years: number): string =>
  new Date(Date.now() - years * 365.25 * 86_400_000).toISOString().slice(0, 10);

let app: Express;
beforeEach(async () => {
  app = createApp();
  const gb = { country: 'GB', currency: 'GBP', jobTitle: 'Engineer' };
  await seedEmployees([
    ...withSalaries({ ...gb, hireDate: yearsAgo(0.5) }, [1000, 2000, 3000, 4000, 5000]),
    ...withSalaries({ ...gb, hireDate: yearsAgo(2) }, [2000, 4000, 6000, 8000, 10000]),
    ...withSalaries({ ...gb, hireDate: yearsAgo(7) }, [1000, 2000, 3000, 4000, 5000, 6000]),
    ...withSalaries({ ...gb, hireDate: yearsAgo(12) }, [100, 200]),
    ...withSalaries(
      { country: 'US', currency: 'USD', jobTitle: 'Engineer', hireDate: yearsAgo(4) },
      [10, 20, 30, 40, 50],
    ),
  ]);
});

const get = (query: Record<string, unknown> = {}, auth = hrAuth) =>
  request(app).get(TENURE).set('Authorization', auth).query(query);

describe('GET /insights/tenure (integration)', () => {
  it('requires a token', async () => {
    expect((await request(app).get(TENURE)).status).toBe(401);
  });

  it('summarises headcount, median and average pay per tenure band and currency', async () => {
    const response = await get();

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      view: 'native',
      approximate: false,
      suppressedGroups: 0,
      bands: [
        { band: '<1y', currency: 'GBP', headcount: 5, median: 3000, avg: 3000 },
        { band: '1-3y', currency: 'GBP', headcount: 5, median: 6000, avg: 6000 },
        { band: '5-10y', currency: 'GBP', headcount: 6, median: 3500, avg: 3500 },
        { band: '10y+', currency: 'GBP', headcount: 2, median: 150, avg: 150 },
        { band: '3-5y', currency: 'USD', headcount: 5, median: 30, avg: 30 },
      ],
    });
  });

  it('applies filters', async () => {
    const response = await get({ currency: 'USD' });

    expect(response.body.data.bands).toEqual([
      { band: '3-5y', currency: 'USD', headcount: 5, median: 30, avg: 30 },
    ]);
  });

  it('rejects an unknown query field with 400', async () => {
    expect((await get({ asOf: '2020-01-01' })).status).toBe(400);
  });

  it('hides bands under 5 people from a VIEWER and counts them, while HR sees them', async () => {
    const viewer = await get({}, viewerAuth);
    const hr = await get({}, hrAuth);

    expect(viewer.body.data.bands.map((b: { band: string }) => b.band)).toEqual([
      '<1y',
      '1-3y',
      '5-10y',
      '3-5y',
    ]);
    expect(viewer.body.data.suppressedGroups).toBe(1);
    expect(hr.body.data.bands).toHaveLength(5);
    expect(JSON.stringify(viewer.body.data)).not.toContain('"avg":150');
  });
});
