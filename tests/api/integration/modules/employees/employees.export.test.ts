import type { Express } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '@api/app/app.js';
import { prisma } from '@api/database/prisma.js';
import { streamEmployees } from '@api/modules/employees/employees.repository.js';
import { hrAuth as hr, viewerAuth as viewer } from '@tests/helpers/tokens.js';

const EXPORT = '/api/v1/employees/export.csv';
const HEADER =
  'id,fullName,email,jobTitle,department,country,currency,salary,employmentType,hireDate';

let app: Express;
beforeEach(() => {
  app = createApp();
});

let counter = 0;
function seed(overrides: Record<string, unknown> = {}) {
  counter += 1;
  return prisma.employee.create({
    data: {
      fullName: `Person ${counter}`,
      email: `person${counter}@example.com`,
      jobTitle: 'Engineer',
      department: 'Engineering',
      country: 'GB',
      currency: 'GBP',
      salary: 5_000_000,
      employmentType: 'FULL_TIME',
      hireDate: new Date('2021-03-04'),
      ...overrides,
    },
  });
}

// supertest buffers text/csv into res.text only when told to.
const download = (query: Record<string, unknown> = {}, auth = hr) =>
  request(app)
    .get(EXPORT)
    .set('Authorization', auth)
    .query(query)
    .buffer(true)
    .parse((res, done) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk: string) => (data += chunk));
      res.on('end', () => done(null, data));
    });

const lines = (body: unknown) => (body as string).split('\r\n').filter((line) => line !== '');

describe('GET /employees/export.csv (integration)', () => {
  it('requires a token', async () => {
    const response = await request(app).get(EXPORT);

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHORIZED');
  });

  it('is open to a VIEWER (it is a read)', async () => {
    await seed();

    expect((await download({}, viewer)).status).toBe(200);
  });

  it('is not captured by /:id (no UUID validation error)', async () => {
    const response = await download();

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/^text\/csv/);
  });

  it('sends CSV headers with an attachment filename', async () => {
    const response = await download();

    expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
    expect(response.headers['content-disposition']).toMatch(
      /^attachment; filename="employees-\d{4}-\d{2}-\d{2}\.csv"$/,
    );
  });

  it('writes the header row with columns in a fixed order, and only that when empty', async () => {
    const response = await download();

    expect(lines(response.body)).toEqual([HEADER]);
  });

  it('exports one row per employee with salary in minor units next to the currency', async () => {
    const employee = await seed({ fullName: 'Ada Lovelace', email: 'ada@example.com' });

    const response = await download();

    expect(lines(response.body)).toEqual([
      HEADER,
      `${employee.id},Ada Lovelace,ada@example.com,Engineer,Engineering,GB,GBP,5000000,FULL_TIME,2021-03-04`,
    ]);
  });

  it('escapes commas, quotes and newlines', async () => {
    await seed({ fullName: 'Lovelace, Ada', jobTitle: 'The "Analyst"', department: 'R&D\nLab' });

    const response = await download();

    expect(response.body).toContain('"Lovelace, Ada"');
    expect(response.body).toContain('"The ""Analyst"""');
    expect(response.body).toContain('"R&D\nLab"');
  });

  it('prefixes a single quote to cells starting with =, +, - or @', async () => {
    await seed({
      fullName: '=SUM(1+1)',
      jobTitle: '+1',
      department: '-1',
      email: '@name@example.com',
    });

    const response = await download();
    const row = (response.body as string).split('\r\n')[1] ?? '';

    expect(row).toContain(",'=SUM(1+1),");
    expect(row).toContain(",'+1,");
    expect(row).toContain(",'-1,");
    expect(row).toContain(",'@name@example.com,");
    expect(row).not.toMatch(/(^|,)[=+\-@]/);
  });

  it('applies the same filters as the list endpoint', async () => {
    await seed({ fullName: 'Ada', country: 'GB', department: 'Research', jobTitle: 'Scientist' });
    await seed({ fullName: 'Grace', country: 'US', currency: 'USD', department: 'Research' });
    await seed({ fullName: 'Linus', country: 'US', currency: 'USD', department: 'Engineering' });

    const us = await download({ country: 'us' });
    const combined = await download({ country: 'US', department: 'Research' });
    const search = await download({ search: 'ADA' });
    const jobTitle = await download({ jobTitle: 'Scientist' });
    const none = await download({ country: 'JP' });

    expect(lines(us.body)).toHaveLength(3);
    expect(lines(combined.body)).toHaveLength(2);
    expect(lines(combined.body)[1]).toContain('Grace');
    expect(lines(search.body)[1]).toContain('Ada');
    expect(lines(jobTitle.body)).toHaveLength(2);
    expect(lines(none.body)).toEqual([HEADER]);
  });

  it('applies the same sort as the list endpoint', async () => {
    await seed({ fullName: 'Bea', salary: 200 });
    await seed({ fullName: 'Cy', salary: 300 });
    await seed({ fullName: 'Al', salary: 100 });

    const bySalaryDesc = await download({ sortBy: 'salary', sortDir: 'desc' });
    const defaultSort = await download();

    expect(
      lines(bySalaryDesc.body)
        .slice(1)
        .map((l) => l.split(',')[1]),
    ).toEqual(['Cy', 'Bea', 'Al']);
    expect(
      lines(defaultSort.body)
        .slice(1)
        .map((l) => l.split(',')[1]),
    ).toEqual(['Al', 'Bea', 'Cy']);
  });

  it.each([
    ['sortBy outside the whitelist', { sortBy: 'passwordHash' }],
    ['bad country', { country: 'ZZ' }],
    ['page (not applicable to an export)', { page: 2 }],
  ])('rejects %s with a 400 JSON envelope', async (_label, query) => {
    const response = await request(app).get(EXPORT).set('Authorization', hr).query(query);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: expect.any(String),
      code: 'VALIDATION_ERROR',
      requestId: expect.stringMatching(/^req_/),
    });
  });
});

describe('streamEmployees (integration)', () => {
  it('walks every row exactly once across multiple batches, even with tied sort keys', async () => {
    for (let i = 0; i < 7; i += 1) {
      await seed({ country: i % 2 === 0 ? 'GB' : 'US', salary: 1000 });
    }

    const seen: string[] = [];
    let batches = 0;
    // Tiny batch size forces several cursor hops; every salary ties.
    for await (const batch of streamEmployees({}, { sortBy: 'salary', sortDir: 'asc' }, 3)) {
      batches += 1;
      expect(batch.length).toBeLessThanOrEqual(3);
      seen.push(...batch.map((employee) => employee.id));
    }

    expect(batches).toBe(3);
    expect(seen).toHaveLength(7);
    expect(new Set(seen).size).toBe(7);
  });

  it('yields nothing when no rows match', async () => {
    const batches: unknown[] = [];
    for await (const batch of streamEmployees(
      { country: 'JP' },
      { sortBy: 'fullName', sortDir: 'asc' },
    )) {
      batches.push(batch);
    }

    expect(batches).toEqual([]);
  });
});

describe('GET /employees/export.csv by role (integration)', () => {
  const VIEWER_HEADER =
    'id,fullName,email,jobTitle,department,country,currency,employmentType,hireDate';

  it('gives a VIEWER no salary column: not in the header, not in any row', async () => {
    await seed({ salary: 7_654_321 });
    await seed({ salary: 1_234_567 });

    const response = await download({}, viewer);
    const rows = lines(response.body);

    expect(response.status).toBe(200);
    expect(rows[0]).toBe(VIEWER_HEADER);
    expect(rows).toHaveLength(3);
    expect(response.body).not.toContain('salary');
    expect(response.body).not.toContain('7654321');
    expect(response.body).not.toContain('1234567');
    for (const row of rows) expect(row.split(',')).toHaveLength(VIEWER_HEADER.split(',').length);
  });

  it('exports the same rows to a VIEWER as to an HR_MANAGER, in the same order', async () => {
    await seed();
    await seed();
    const idsOf = (body: unknown) =>
      lines(body)
        .slice(1)
        .map((row) => row.split(',')[0]);

    const forViewer = await download({ sortBy: 'email', sortDir: 'desc' }, viewer);
    const forHr = await download({ sortBy: 'email', sortDir: 'desc' }, hr);

    expect(idsOf(forViewer.body)).toEqual(idsOf(forHr.body));
  });

  it('still gives an HR_MANAGER the salary column and values', async () => {
    await seed({ salary: 7_654_321 });

    const rows = lines((await download({}, hr)).body);

    expect(rows[0]).toBe(HEADER);
    expect(rows[1]?.split(',')[7]).toBe('7654321');
  });

  it('sends only the header to a VIEWER when nothing matches, still without salary', async () => {
    const response = await download({ country: 'JP' }, viewer);

    expect(lines(response.body)).toEqual([VIEWER_HEADER]);
  });
});
