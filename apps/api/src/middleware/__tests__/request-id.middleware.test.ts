import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { requestIdMiddleware } from '../request-id.middleware.js';

function buildApp() {
  const app = express();
  app.use(requestIdMiddleware);
  app.get('/', (req, res) => {
    res.json({ requestId: req.requestId });
  });
  return app;
}

describe('requestIdMiddleware', () => {
  it('generates a req_ prefixed id when no header is provided', async () => {
    const response = await request(buildApp()).get('/');

    expect(response.body.requestId).toMatch(/^req_[A-Za-z0-9_-]+$/);
    expect(response.headers['x-request-id']).toBe(response.body.requestId);
  });

  it('echoes a safe incoming X-Request-Id header', async () => {
    const response = await request(buildApp()).get('/').set('X-Request-Id', 'client-abc123');

    expect(response.body.requestId).toBe('client-abc123');
    expect(response.headers['x-request-id']).toBe('client-abc123');
  });

  it('regenerates the id when the incoming header contains unsafe characters', async () => {
    const response = await request(buildApp())
      .get('/')
      .set('X-Request-Id', '<script>alert(1)</script>');

    expect(response.body.requestId).toMatch(/^req_[A-Za-z0-9_-]+$/);
  });

  it('regenerates the id when the incoming header is too long', async () => {
    const response = await request(buildApp()).get('/').set('X-Request-Id', 'a'.repeat(65));

    expect(response.body.requestId).toMatch(/^req_[A-Za-z0-9_-]+$/);
  });
});
