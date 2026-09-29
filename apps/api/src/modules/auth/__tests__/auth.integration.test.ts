import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../../../app/app.js';

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
      role: 'HR_MANAGER',
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
      role: 'HR_MANAGER',
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
});
