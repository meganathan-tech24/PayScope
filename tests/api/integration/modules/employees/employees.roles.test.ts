import type { Express } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '@api/app/app.js';
import { prisma } from '@api/database/prisma.js';
import { employeeDirectorySchema, employeeFullSchema } from '@shared/index.js';
import { buildEmployeeInput } from '@tests/factories/employee.js';
import { hrAuth, viewerAuth } from '@tests/helpers/tokens.js';

const API = '/api/v1/employees';

let app: Express;
beforeEach(() => {
  app = createApp();
});

const seed = (n: number, salary = 5_000_000 + n) =>
  prisma.employee.create({
    data: {
      ...buildEmployeeInput({ email: `person${n}@example.com`, fullName: `Person ${n}` }),
      salary,
      employmentType: 'FULL_TIME',
      hireDate: new Date('2020-01-15'),
    },
  });

// Two independent checks: the strict directory schema fails on any extra key, and
// the raw body text is searched so a salary nested anywhere would also be caught.
function expectDirectoryOnly(response: request.Response, items: unknown[]) {
  expect(items.length).toBeGreaterThan(0);
  for (const item of items) {
    expect(employeeDirectorySchema.strict().safeParse(item).success).toBe(true);
    expect(item).not.toHaveProperty('salary');
  }
  expect(response.text).not.toContain('salary');
}

describe('employee list and detail by role (integration)', () => {
  it('gives a VIEWER the directory shape on the list, with no salary key or text', async () => {
    await seed(1);
    await seed(2);

    const response = await request(app).get(API).set('Authorization', viewerAuth);

    expect(response.status).toBe(200);
    expectDirectoryOnly(response, response.body.data);
    expect(response.body.meta.total).toBe(2);
  });

  it('gives a VIEWER the directory shape on the detail', async () => {
    const created = await seed(1);

    const response = await request(app)
      .get(`${API}/${created.id}`)
      .set('Authorization', viewerAuth);

    expect(response.status).toBe(200);
    expectDirectoryOnly(response, [response.body.data]);
  });

  it('still gives an HR_MANAGER the full shape, salary included, on list and detail', async () => {
    const created = await seed(1, 7_500_000);

    const list = await request(app).get(API).set('Authorization', hrAuth);
    const detail = await request(app).get(`${API}/${created.id}`).set('Authorization', hrAuth);

    expect(employeeFullSchema.strict().safeParse(list.body.data[0]).success).toBe(true);
    expect(list.body.data[0].salary).toBe(7_500_000);
    expect(employeeFullSchema.strict().safeParse(detail.body.data).success).toBe(true);
    expect(detail.body.data.salary).toBe(7_500_000);
  });

  it('gives a VIEWER no salary even when filtering, searching and paging', async () => {
    await seed(1);
    await seed(2);

    const response = await request(app)
      .get(API)
      .set('Authorization', viewerAuth)
      .query({ country: 'GB', search: 'person', pageSize: 1, page: 2, sortBy: 'hireDate' });

    expect(response.status).toBe(200);
    expectDirectoryOnly(response, response.body.data);
  });

  it('does not let a VIEWER learn about a missing id differently from before', async () => {
    const response = await request(app)
      .get(`${API}/00000000-0000-4000-8000-000000000000`)
      .set('Authorization', viewerAuth);

    expect(response.status).toBe(404);
    expect(response.body.code).toBe('EMPLOYEE_NOT_FOUND');
  });

  it('keeps writes HR-only, and a create answers HR with salary', async () => {
    const asViewer = await request(app)
      .post(API)
      .set('Authorization', viewerAuth)
      .send(buildEmployeeInput());
    const asHr = await request(app)
      .post(API)
      .set('Authorization', hrAuth)
      .send(buildEmployeeInput());

    expect(asViewer.status).toBe(403);
    expect(asHr.status).toBe(201);
    expect(asHr.body.data.salary).toBe(9_000_000);
  });

  it('applies to a real registered user, not only hand-signed tokens', async () => {
    await seed(1);
    const register = (body: Record<string, unknown>) =>
      request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Someone', password: 'Passw0rd!', ...body });
    const viewer = await register({ email: 'v@example.com' });
    const hr = await register({ email: 'h@example.com', role: 'HR_MANAGER' });

    const asViewer = await request(app)
      .get(API)
      .set('Authorization', `Bearer ${viewer.body.data.token}`);
    const asHr = await request(app).get(API).set('Authorization', `Bearer ${hr.body.data.token}`);

    expectDirectoryOnly(asViewer, asViewer.body.data);
    expect(asHr.body.data[0]).toHaveProperty('salary');
  });
});
