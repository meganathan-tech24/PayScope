import type { Express } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../app/app.js';
import { prisma } from '../../database/prisma.js';
import { DEFAULT_DEMO_PASSWORD, DEMO_USERS, runSeed } from '../seed.js';

let app: Express;
beforeEach(() => {
  app = createApp();
});

const login = (email: string, password: string) =>
  request(app).post('/api/v1/auth/login').send({ email, password });

const [HR, VIEWER] = DEMO_USERS;

describe('runSeed (integration)', () => {
  it('seeds exactly 10,000 employees and is re-runnable with identical ids', async () => {
    await runSeed({ prisma });
    const firstRun = await prisma.employee.findMany({
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    await runSeed({ prisma });
    const secondRun = await prisma.employee.findMany({
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    expect(firstRun).toHaveLength(10_000);
    expect(secondRun).toEqual(firstRun);
  }, 60_000);

  it('stores rows that satisfy the database constraints and spread across countries', async () => {
    await runSeed({ prisma, count: 500 });

    const byCountry = await prisma.employee.groupBy({ by: ['country'], _count: true });
    const negative = await prisma.employee.count({ where: { salary: { lt: 0 } } });

    expect(byCountry.length).toBeGreaterThanOrEqual(8);
    expect(negative).toBe(0);
  });

  it('replaces existing employees but leaves other users and their data alone', async () => {
    await prisma.employee.create({
      data: {
        fullName: 'Stale Row',
        email: 'stale@example.com',
        jobTitle: 'Engineer',
        department: 'Engineering',
        country: 'US',
        currency: 'USD',
        salary: 1,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2020-01-01'),
      },
    });
    await prisma.user.create({
      data: { name: 'Someone', email: 'someone@example.com', passwordHash: 'x', role: 'VIEWER' },
    });

    await runSeed({ prisma, count: 50 });

    expect(await prisma.employee.count()).toBe(50);
    expect(await prisma.employee.count({ where: { email: 'stale@example.com' } })).toBe(0);
    expect(await prisma.user.count({ where: { email: 'someone@example.com' } })).toBe(1);
  });

  it('does not duplicate demo users on a second run', async () => {
    await runSeed({ prisma, count: 10 });
    await runSeed({ prisma, count: 10 });

    expect(
      await prisma.user.count({ where: { email: { in: DEMO_USERS.map((u) => u.email) } } }),
    ).toBe(2);
  });

  it('lets the HR demo user log in and read all 10,000 employees through the API', async () => {
    await runSeed({ prisma });

    const response = await login(HR.email, DEFAULT_DEMO_PASSWORD);
    expect(response.status).toBe(200);
    expect(response.body.data.user).toMatchObject({ email: HR.email, role: 'HR_MANAGER' });
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');

    const list = await request(app)
      .get('/api/v1/employees')
      .set('Authorization', `Bearer ${response.body.data.token as string}`);
    expect(list.status).toBe(200);
    expect(list.body.meta).toMatchObject({ page: 1, pageSize: 25, total: 10_000, totalPages: 400 });
  }, 60_000);

  it('lets the Viewer demo user read but not write', async () => {
    await runSeed({ prisma, count: 20 });

    const response = await login(VIEWER.email, DEFAULT_DEMO_PASSWORD);
    expect(response.status).toBe(200);
    expect(response.body.data.user.role).toBe('VIEWER');
    const auth = `Bearer ${response.body.data.token as string}`;

    expect((await request(app).get('/api/v1/employees').set('Authorization', auth)).status).toBe(
      200,
    );
    const write = await request(app).post('/api/v1/employees').set('Authorization', auth).send({});
    expect(write.status).toBe(403);
  });

  it('applies a custom demo password and stops accepting the default one', async () => {
    await runSeed({ prisma, count: 5 });
    await runSeed({ prisma, count: 5, demoPassword: 'Another-Passw0rd!' });

    expect((await login(HR.email, 'Another-Passw0rd!')).status).toBe(200);
    expect((await login(HR.email, DEFAULT_DEMO_PASSWORD)).status).toBe(401);
  });
});
