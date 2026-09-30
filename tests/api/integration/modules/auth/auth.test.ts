import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '@api/app/app.js';
import { prisma } from '@api/database/prisma.js';
import { verifyToken } from '@api/lib/jwt.js';
import { buildEmployeeInput } from '@tests/factories/employee.js';

const VALID_PASSWORD = 'Passw0rd!';

function registerPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: VALID_PASSWORD,
    ...overrides,
  };
}

describe('auth (integration)', () => {
  it('registers a new user and returns { user, token } without passwordHash', async () => {
    const response = await request(createApp())
      .post('/api/v1/auth/register')
      .send(registerPayload());

    expect(response.status).toBe(201);
    expect(response.body.data.user).toEqual({
      id: expect.any(String),
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'VIEWER',
    });
    expect(response.body.data).not.toHaveProperty('passwordHash');
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
    expect(typeof response.body.data.token).toBe('string');
  });

  it('rejects a duplicate email with 409', async () => {
    const app = createApp();
    await request(app).post('/api/v1/auth/register').send(registerPayload());

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(registerPayload({ name: 'Someone Else' }));

    expect(response.status).toBe(409);
    expect(response.body.code).toBe('EMAIL_TAKEN');
  });

  it('logs in with correct credentials', async () => {
    const app = createApp();
    await request(app).post('/api/v1/auth/register').send(registerPayload());

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.com', password: VALID_PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe('ada@example.com');
    expect(typeof response.body.data.token).toBe('string');
  });

  it('rejects a wrong password and an unknown email with the identical generic body', async () => {
    const app = createApp();
    await request(app).post('/api/v1/auth/register').send(registerPayload());

    const wrongPassword = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.com', password: 'not-the-right-password' });
    const unknownEmail = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'anything' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
    expect(wrongPassword.body.code).toBe('AUTH_INVALID_CREDENTIALS');
    expect(unknownEmail.body.code).toBe('AUTH_INVALID_CREDENTIALS');
  });

  it('GET /me returns the current user for a valid token', async () => {
    const app = createApp();
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(registerPayload());
    const token = registerResponse.body.data.token as string;

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      id: registerResponse.body.data.user.id,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'VIEWER',
    });
  });

  it('GET /me returns 401 without a token', async () => {
    const response = await request(createApp()).get('/api/v1/auth/me');

    expect(response.status).toBe(401);
  });

  it('POST /logout returns a confirmation for an authenticated user', async () => {
    const app = createApp();
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(registerPayload());
    const token = registerResponse.body.data.token as string;

    const response = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.message).toBeTruthy();
  });

  describe('registration role', () => {
    const register = (app: ReturnType<typeof createApp>, overrides: Record<string, unknown> = {}) =>
      request(app).post('/api/v1/auth/register').send(registerPayload(overrides));

    it('creates a VIEWER when the role is omitted, in the response, the token and the database', async () => {
      const response = await register(createApp());

      expect(response.status).toBe(201);
      expect(response.body.data.user.role).toBe('VIEWER');
      expect(verifyToken(response.body.data.token).role).toBe('VIEWER');
      const stored = await prisma.user.findUniqueOrThrow({ where: { email: 'ada@example.com' } });
      expect(stored.role).toBe('VIEWER');
    });

    it.each(['HR_MANAGER', 'VIEWER'])('creates the requested %s', async (role) => {
      const response = await register(createApp(), { role });

      expect(response.status).toBe(201);
      expect(response.body.data.user.role).toBe(role);
      expect(verifyToken(response.body.data.token)).toMatchObject({ role });
      const stored = await prisma.user.findUniqueOrThrow({ where: { email: 'ada@example.com' } });
      expect(stored.role).toBe(role);
    });

    it.each([
      ['an unknown role', { role: 'ADMIN' }],
      ['a lowercase role', { role: 'viewer' }],
      ['a null role', { role: null }],
      ['an extra field', { isAdmin: true }],
    ])('rejects %s with 400 and creates no user', async (_label, overrides) => {
      const response = await register(createApp(), overrides);

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(await prisma.user.count()).toBe(0);
    });

    it('returns the role from login and /me for both roles, with a minimal token payload', async () => {
      const app = createApp();
      for (const [email, role] of [
        ['hr@example.com', 'HR_MANAGER'],
        ['viewer@example.com', 'VIEWER'],
      ] as const) {
        await register(app, { email, role });

        const login = await request(app)
          .post('/api/v1/auth/login')
          .send({ email, password: VALID_PASSWORD });
        const me = await request(app)
          .get('/api/v1/auth/me')
          .set('Authorization', `Bearer ${login.body.data.token}`);

        expect(login.body.data.user.role).toBe(role);
        expect(me.body.data.role).toBe(role);
        expect(Object.keys(verifyToken(login.body.data.token)).sort()).toEqual(['role', 'sub']);
      }
    });

    it('rejects a login that supplies a role or portal field', async () => {
      const app = createApp();
      await register(app);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'ada@example.com', password: VALID_PASSWORD, role: 'HR_MANAGER' });

      expect(response.status).toBe(400);
    });

    it('does not let a role-less registration write employees', async () => {
      const app = createApp();
      const registered = await register(app);

      const response = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${registered.body.data.token}`)
        .send(buildEmployeeInput());

      expect(response.status).toBe(403);
    });
  });
});
