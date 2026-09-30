import type { Express } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '@api/app/app.js';
import { prisma } from '@api/database/prisma.js';
import { buildEmployeeInput } from '@tests/factories/employee.js';
import { hrAuth } from '@tests/helpers/tokens.js';

// Pins what an HR_MANAGER gets from the employee endpoints. Written before role
// filtering was added and must keep passing: role rules may only take data away
// from a VIEWER, never change what HR sees.

const API = '/api/v1/employees';
const FULL_KEYS = [
  'createdAt',
  'currency',
  'country',
  'department',
  'email',
  'employmentType',
  'fullName',
  'hireDate',
  'id',
  'jobTitle',
  'salary',
  'updatedAt',
].sort();

let app: Express;
beforeEach(() => {
  app = createApp();
});

const seed = (n: number, salary: number) =>
  prisma.employee.create({
    data: {
      ...buildEmployeeInput({ email: `hr-regression-${n}@example.com`, fullName: `Person ${n}` }),
      salary,
      employmentType: 'FULL_TIME',
      hireDate: new Date('2020-01-15'),
    },
  });

describe('HR_MANAGER employee responses (regression)', () => {
  it('lists employees with every field, salary included, and page meta', async () => {
    await seed(1, 3_000_000);

    const response = await request(app).get(API).set('Authorization', hrAuth);

    expect(response.status).toBe(200);
    expect(Object.keys(response.body.data[0]).sort()).toEqual(FULL_KEYS);
    expect(response.body.data[0]).toMatchObject({
      salary: 3_000_000,
      hireDate: expect.any(String),
    });
    expect(response.body.meta).toMatchObject({ page: 1, total: 1, totalPages: 1 });
  });

  it('returns every field, salary included, for one employee', async () => {
    const created = await seed(1, 3_000_000);

    const response = await request(app).get(`${API}/${created.id}`).set('Authorization', hrAuth);

    expect(response.status).toBe(200);
    expect(Object.keys(response.body.data).sort()).toEqual(FULL_KEYS);
    expect(response.body.data.salary).toBe(3_000_000);
  });

  it('returns every field, salary included, when creating', async () => {
    const response = await request(app)
      .post(API)
      .set('Authorization', hrAuth)
      .send(buildEmployeeInput());

    expect(response.status).toBe(201);
    expect(Object.keys(response.body.data).sort()).toEqual(FULL_KEYS);
  });

  it('sorts by salary in both directions', async () => {
    await seed(1, 3_000_000);
    await seed(2, 1_000_000);
    await seed(3, 2_000_000);
    const salaries = async (sortDir: string) =>
      (
        await request(app)
          .get(API)
          .set('Authorization', hrAuth)
          .query({ sortBy: 'salary', sortDir })
      ).body.data.map((employee: { salary: number }) => employee.salary);

    expect(await salaries('asc')).toEqual([1_000_000, 2_000_000, 3_000_000]);
    expect(await salaries('desc')).toEqual([3_000_000, 2_000_000, 1_000_000]);
  });

  it('exports a salary column in the same position as before', async () => {
    await seed(1, 3_000_000);

    const response = await request(app)
      .get(`${API}/export.csv`)
      .set('Authorization', hrAuth)
      .buffer(true)
      .parse((res, done) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => (data += chunk));
        res.on('end', () => done(null, data));
      });

    const [header, row] = (response.body as string).split('\r\n');
    expect(header).toBe(
      'id,fullName,email,jobTitle,department,country,currency,salary,employmentType,hireDate',
    );
    expect(row?.split(',')[7]).toBe('3000000');
  });
});
