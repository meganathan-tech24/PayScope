import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createRateLimiter } from '../rate-limit.middleware.js';
import { requestIdMiddleware } from '../request-id.middleware.js';

function buildApp() {
  const app = express();
  app.use(requestIdMiddleware);
  app.use(createRateLimiter({ windowMs: 60_000, limit: 3 }));
  app.get('/', (_req, res) => res.json({ ok: true }));
  return app;
}

describe('createRateLimiter', () => {
  it('allows requests under the limit', async () => {
    const app = buildApp();

    const first = await request(app).get('/');
    const second = await request(app).get('/');

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
  });

  it('returns a 429 envelope once the limit is exceeded', async () => {
    const app = buildApp();

    await request(app).get('/');
    await request(app).get('/');
    await request(app).get('/');
    const blocked = await request(app).get('/');

    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({
      success: false,
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMITED',
      requestId: expect.stringMatching(/^req_/),
    });
  });
});
