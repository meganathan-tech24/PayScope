import express from 'express';
import jsonwebtoken from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/logging/logger.js', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), fatal: vi.fn() },
}));

import { config } from '../../app/config/config.js';
import { signToken } from '../../lib/jwt.js';
import { authenticate } from '../auth.middleware.js';
import { errorHandler } from '../error.middleware.js';

function buildApp() {
  const app = express();
  app.get('/protected', authenticate, (req, res) => {
    res.json({ user: req.user });
  });
  app.use(errorHandler);
  return app;
}

describe('authenticate', () => {
  it('returns 401 when the Authorization header is missing', async () => {
    const response = await request(buildApp()).get('/protected');

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 when the header has no Bearer prefix', async () => {
    const token = signToken({ sub: 'user-1', role: 'HR_MANAGER' });

    const response = await request(buildApp()).get('/protected').set('Authorization', token);

    expect(response.status).toBe(401);
  });

  it('returns 401 for an empty bearer token', async () => {
    const response = await request(buildApp()).get('/protected').set('Authorization', 'Bearer ');

    expect(response.status).toBe(401);
  });

  it('returns 401 for a malformed/garbage token', async () => {
    const response = await request(buildApp())
      .get('/protected')
      .set('Authorization', 'Bearer not-a-real-token');

    expect(response.status).toBe(401);
  });

  it('returns 401 for an expired token', async () => {
    const expired = jsonwebtoken.sign({ sub: 'user-1', role: 'HR_MANAGER' }, config.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: -10,
    });

    const response = await request(buildApp())
      .get('/protected')
      .set('Authorization', `Bearer ${expired}`);

    expect(response.status).toBe(401);
  });

  it('returns 401 for a token signed with a different algorithm (alg: none)', async () => {
    const noneAlgToken = jsonwebtoken.sign({ sub: 'user-1', role: 'HR_MANAGER' }, '', {
      algorithm: 'none',
    });

    const response = await request(buildApp())
      .get('/protected')
      .set('Authorization', `Bearer ${noneAlgToken}`);

    expect(response.status).toBe(401);
  });

  it('returns 401 for a token signed with the wrong secret', async () => {
    const forged = jsonwebtoken.sign(
      { sub: 'user-1', role: 'HR_MANAGER' },
      'a-completely-different-secret-not-ours-at-all-32chars',
      { algorithm: 'HS256' },
    );

    const response = await request(buildApp())
      .get('/protected')
      .set('Authorization', `Bearer ${forged}`);

    expect(response.status).toBe(401);
  });

  it('attaches req.user and calls next() for a valid token', async () => {
    const token = signToken({ sub: 'user-1', role: 'HR_MANAGER' });

    const response = await request(buildApp())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({ id: 'user-1', role: 'HR_MANAGER' });
  });
});
