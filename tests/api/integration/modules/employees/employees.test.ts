import type { Express } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '@api/app/app.js';
import { signToken } from '@api/lib/jwt.js';

// Fresh app per test so the in-memory rate limiter never accumulates across tests.
let app: Express;
beforeEach(() => {
  app = createApp();
});

const API = '/api/v1/employees';
const MISSING_ID = '00000000-0000-4000-8000-000000000000';

// authenticate trusts the signed payload (no DB read), so tokens can be
// hand-signed. Registration only ever creates HR_MANAGER, so this is also the
// only way to get a VIEWER.
const hr = `Bearer ${signToken({ sub: 'hr-user', role: 'HR_MANAGER' })}`;
const viewer = `Bearer ${signToken({ sub: 'viewer-user', role: 'VIEWER' })}`;

function payload(overrides: Record<string, unknown> = {}) {
  return {
    fullName: 'Ada Lovelace',
    email: 'ada@example.com',
    jobTitle: 'Engineer',
    department: 'Engineering',
    country: 'GB',
    currency: 'GBP',
    salary: 9_000_000,
    employmentType: 'FULL_TIME',
    hireDate: '2020-01-15',
    ...overrides,
  };
}

const create = (overrides: Record<string, unknown> = {}) =>
  request(app).post(API).set('Authorization', hr).send(payload(overrides));

const list = (query: Record<string, unknown> = {}, auth = hr) =>
  request(app).get(API).set('Authorization', auth).query(query);

function expectErrorEnvelope(body: Record<string, unknown>, code: string) {
  expect(body).toEqual({
    success: false,
    message: expect.any(String),
    code,
    requestId: expect.stringMatching(/^req_/),
  });
}

describe('employees CRUD (integration)', () => {
  it('creates, reads, updates and deletes an employee', async () => {
    const created = await create({ email: '  ADA@Example.com ', country: 'gb' });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      country: 'GB',
      salary: 9_000_000,
    });
    const id = created.body.data.id as string;

    const fetched = await request(app).get(`${API}/${id}`).set('Authorization', hr);
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.id).toBe(id);

    const updated = await request(app)
      .put(`${API}/${id}`)
      .set('Authorization', hr)
      .send(payload({ jobTitle: 'Principal Engineer', salary: 12_000_000 }));
    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({ jobTitle: 'Principal Engineer', salary: 12_000_000 });

    const deleted = await request(app).delete(`${API}/${id}`).set('Authorization', hr);
    expect(deleted.status).toBe(204);
    expect(deleted.text).toBe('');

    const gone = await request(app).get(`${API}/${id}`).set('Authorization', hr);
    expect(gone.status).toBe(404);
  });

  it('lets a VIEWER read but not write', async () => {
    const created = await create();
    const id = created.body.data.id as string;

    expect((await list({}, viewer)).status).toBe(200);
    const single = await request(app).get(`${API}/${id}`).set('Authorization', viewer);
    expect(single.status).toBe(200);
  });
});

describe('employees authentication and authorization (integration)', () => {
  it.each([
    ['GET list', () => request(app).get(API)],
    ['GET by id', () => request(app).get(`${API}/${MISSING_ID}`)],
    ['POST', () => request(app).post(API).send(payload())],
    ['PUT', () => request(app).put(`${API}/${MISSING_ID}`).send(payload())],
    ['DELETE', () => request(app).delete(`${API}/${MISSING_ID}`)],
  ])('%s without a token is 401', async (_label, send) => {
    const response = await send();

    expect(response.status).toBe(401);
    expectErrorEnvelope(response.body, 'UNAUTHORIZED');
  });

  it('rejects a garbage token with 401', async () => {
    const response = await request(app).get(API).set('Authorization', 'Bearer nope');

    expect(response.status).toBe(401);
  });

  it.each([
    ['POST', () => request(app).post(API).set('Authorization', viewer).send(payload())],
    [
      'PUT',
      () => request(app).put(`${API}/${MISSING_ID}`).set('Authorization', viewer).send(payload()),
    ],
    ['DELETE', () => request(app).delete(`${API}/${MISSING_ID}`).set('Authorization', viewer)],
  ])('%s as a VIEWER is 403', async (_label, send) => {
    const response = await send();

    expect(response.status).toBe(403);
    expectErrorEnvelope(response.body, 'FORBIDDEN');
  });

  it('does not create anything when a VIEWER attempts a POST', async () => {
    await request(app).post(API).set('Authorization', viewer).send(payload());

    expect((await list()).body.meta.total).toBe(0);
  });
});

describe('employees validation, conflicts and 404s (integration)', () => {
  it.each([
    ['invalid email', { email: 'nope' }],
    ['unknown country', { country: 'ZZ' }],
    ['unknown currency', { currency: 'XYZ' }],
    ['negative salary', { salary: -5 }],
    ['future hireDate', { hireDate: '2999-01-01' }],
    ['unknown field', { isAdmin: true }],
  ])('POST with %s is 400 with the standard envelope', async (_label, overrides) => {
    const response = await create(overrides);

    expect(response.status).toBe(400);
    expectErrorEnvelope(response.body, 'VALIDATION_ERROR');
  });

  it('rejects a body with a missing required field', async () => {
    const { jobTitle: _omit, ...incomplete } = payload();

    const response = await request(app).post(API).set('Authorization', hr).send(incomplete);

    expect(response.status).toBe(400);
  });

  it('rejects a non-UUID id with 400', async () => {
    const response = await request(app).get(`${API}/not-a-uuid`).set('Authorization', hr);

    expect(response.status).toBe(400);
    expectErrorEnvelope(response.body, 'VALIDATION_ERROR');
  });

  it('returns 409 for a duplicate email on create, ignoring email case', async () => {
    await create();

    const response = await create({ fullName: 'Someone Else', email: 'ADA@example.com' });

    expect(response.status).toBe(409);
    expectErrorEnvelope(response.body, 'EMPLOYEE_EMAIL_TAKEN');
  });

  it('returns 409 when an update collides with another employee email', async () => {
    await create({ email: 'first@example.com' });
    const second = await create({ email: 'second@example.com' });

    const response = await request(app)
      .put(`${API}/${second.body.data.id as string}`)
      .set('Authorization', hr)
      .send(payload({ email: 'first@example.com' }));

    expect(response.status).toBe(409);
    expectErrorEnvelope(response.body, 'EMPLOYEE_EMAIL_TAKEN');
  });

  it('allows an update that keeps the same email', async () => {
    const created = await create();

    const response = await request(app)
      .put(`${API}/${created.body.data.id as string}`)
      .set('Authorization', hr)
      .send(payload({ department: 'Research' }));

    expect(response.status).toBe(200);
  });

  it.each([
    ['GET', () => request(app).get(`${API}/${MISSING_ID}`).set('Authorization', hr)],
    [
      'PUT',
      () => request(app).put(`${API}/${MISSING_ID}`).set('Authorization', hr).send(payload()),
    ],
    ['DELETE', () => request(app).delete(`${API}/${MISSING_ID}`).set('Authorization', hr)],
  ])('%s of an unknown id is 404 with the standard envelope', async (_label, send) => {
    const response = await send();

    expect(response.status).toBe(404);
    expectErrorEnvelope(response.body, 'EMPLOYEE_NOT_FOUND');
  });
});

describe('employees list: pagination, sort and filters (integration)', () => {
  beforeEach(async () => {
    const rows = [
      { fullName: 'Ada Lovelace', email: 'ada@example.com', country: 'GB', currency: 'GBP' },
      { fullName: 'Alan Turing', email: 'alan@example.com', country: 'GB', currency: 'GBP' },
      { fullName: 'Grace Hopper', email: 'grace@example.com', country: 'US', currency: 'USD' },
      { fullName: 'Linus Torvalds', email: 'linus@example.com', country: 'US', currency: 'USD' },
      { fullName: 'Katherine Johnson', email: 'kj@example.com', country: 'US', currency: 'USD' },
    ];
    const jobs = ['Engineer', 'Engineer', 'Scientist', 'Engineer', 'Scientist'];
    const departments = ['Engineering', 'Research', 'Research', 'Engineering', 'Research'];
    for (const [index, row] of rows.entries()) {
      await create({
        ...row,
        jobTitle: jobs[index],
        department: departments[index],
        salary: (index + 1) * 1_000_000,
      });
    }
  });

  const names = (body: { data: { fullName: string }[] }) => body.data.map((e) => e.fullName);

  it('returns data with page meta and the default sort by fullName', async () => {
    const response = await list();

    expect(response.status).toBe(200);
    expect(names(response.body)).toEqual([
      'Ada Lovelace',
      'Alan Turing',
      'Grace Hopper',
      'Katherine Johnson',
      'Linus Torvalds',
    ]);
    expect(response.body.meta).toEqual({
      requestId: expect.stringMatching(/^req_/),
      page: 1,
      pageSize: 25,
      total: 5,
      totalPages: 1,
    });
  });

  it('paginates without overlap or gaps across pages', async () => {
    const seen: string[] = [];
    for (const page of [1, 2, 3]) {
      const response = await list({ page, pageSize: 2 });
      expect(response.body.meta).toMatchObject({ page, pageSize: 2, total: 5, totalPages: 3 });
      seen.push(...names(response.body));
    }

    expect(seen).toHaveLength(5);
    expect(new Set(seen).size).toBe(5);
  });

  it('returns an empty page (not an error) beyond the last page', async () => {
    const response = await list({ page: 99, pageSize: 2 });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.meta).toMatchObject({ page: 99, total: 5, totalPages: 3 });
  });

  it('clamps a pageSize over the max to 100', async () => {
    const response = await list({ pageSize: 500 });

    expect(response.status).toBe(200);
    expect(response.body.meta.pageSize).toBe(100);
  });

  it.each([
    ['page 0', { page: 0 }],
    ['pageSize 0', { pageSize: 0 }],
    ['non-numeric page', { page: 'abc' }],
    ['sortBy outside the whitelist', { sortBy: 'passwordHash' }],
    ['bad sortDir', { sortDir: 'up' }],
    ['bad country filter', { country: 'ZZ' }],
    ['unknown query param', { foo: 'bar' }],
  ])('rejects %s with a 400 envelope', async (_label, query) => {
    const response = await list(query);

    expect(response.status).toBe(400);
    expectErrorEnvelope(response.body, 'VALIDATION_ERROR');
  });

  it('sorts by a whitelisted column in both directions', async () => {
    const asc = await list({ sortBy: 'salary', sortDir: 'asc' });
    const desc = await list({ sortBy: 'salary', sortDir: 'desc' });

    expect(names(asc.body)[0]).toBe('Ada Lovelace');
    expect(names(desc.body)[0]).toBe('Katherine Johnson');
  });

  it('keeps ties in a stable order across pages (id tiebreaker)', async () => {
    const first = await list({ sortBy: 'country', pageSize: 2, page: 1 });
    const second = await list({ sortBy: 'country', pageSize: 2, page: 2 });
    const third = await list({ sortBy: 'country', pageSize: 2, page: 3 });
    const repeat = await list({ sortBy: 'country', pageSize: 2, page: 2 });

    const all = [...names(first.body), ...names(second.body), ...names(third.body)];
    expect(new Set(all).size).toBe(5);
    expect(names(second.body)).toEqual(names(repeat.body));
  });

  it('filters by country, department and jobTitle', async () => {
    expect(names((await list({ country: 'us' })).body)).toEqual([
      'Grace Hopper',
      'Katherine Johnson',
      'Linus Torvalds',
    ]);
    expect(names((await list({ department: 'Engineering' })).body)).toEqual([
      'Ada Lovelace',
      'Linus Torvalds',
    ]);
    expect(names((await list({ jobTitle: 'Scientist' })).body)).toEqual([
      'Grace Hopper',
      'Katherine Johnson',
    ]);
  });

  it('combines filters with AND', async () => {
    const response = await list({ country: 'US', department: 'Research', jobTitle: 'Scientist' });

    expect(names(response.body)).toEqual(['Grace Hopper', 'Katherine Johnson']);
    expect(response.body.meta.total).toBe(2);
  });

  it('searches name and email case-insensitively', async () => {
    expect(names((await list({ search: 'ALAN' })).body)).toEqual(['Alan Turing']);
    expect(names((await list({ search: 'KJ@EXAMPLE' })).body)).toEqual(['Katherine Johnson']);
  });

  it('combines search with filters, sort and pagination', async () => {
    const response = await list({
      search: 'a',
      country: 'US',
      sortBy: 'salary',
      sortDir: 'desc',
      pageSize: 1,
      page: 2,
    });

    expect(response.status).toBe(200);
    expect(response.body.meta).toMatchObject({ page: 2, pageSize: 1, total: 3, totalPages: 3 });
    expect(response.body.data).toHaveLength(1);
  });

  it('returns an empty result with total 0 when nothing matches', async () => {
    const response = await list({ country: 'JP' });

    expect(response.body.data).toEqual([]);
    expect(response.body.meta).toMatchObject({ total: 0, totalPages: 0 });
  });

  it('treats a blank search box as no filter', async () => {
    const response = await list({ search: '' });

    expect(response.body.meta.total).toBe(5);
  });
});
