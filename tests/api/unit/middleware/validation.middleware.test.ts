import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

vi.mock('@api/lib/logging/logger.js', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), fatal: vi.fn() },
}));

import { errorHandler } from '@api/middleware/error.middleware.js';
import { requestIdMiddleware } from '@api/middleware/request-id.middleware.js';
import { validate } from '@api/middleware/validation.middleware.js';

const bodySchema = z.object({
  email: z.string().email(),
  age: z.coerce.number().int().positive(),
});

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
});

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(requestIdMiddleware);
  app.post('/body', validate({ body: bodySchema }), (req, res) => {
    res.json({ received: req.body });
  });
  app.get('/query', validate({ query: querySchema }), (req, res) => {
    res.json({ received: req.query });
  });
  app.use(errorHandler);
  return app;
}

describe('validate', () => {
  it('replaces req.body with the parsed and coerced result on success', async () => {
    const response = await request(buildApp()).post('/body').send({ email: 'a@b.com', age: '30' });

    expect(response.status).toBe(200);
    expect(response.body.received).toEqual({ email: 'a@b.com', age: 30 });
  });

  it('returns a 400 validation envelope when the body is invalid', async () => {
    const response = await request(buildApp()).post('/body').send({ email: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(response.body.message).toContain('email');
  });

  it('applies query schema defaults', async () => {
    const response = await request(buildApp()).get('/query');

    expect(response.status).toBe(200);
    expect(response.body.received).toEqual({ page: 1 });
  });

  it('rejects an invalid query value', async () => {
    const response = await request(buildApp()).get('/query').query({ page: '-1' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });
});
