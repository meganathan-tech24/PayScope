import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@api/lib/logging/logger.js', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), fatal: vi.fn() },
}));

import { signToken } from '@api/lib/jwt.js';
import { authenticate } from '@api/middleware/auth.middleware.js';
import { authorize } from '@api/middleware/authorize.middleware.js';
import { errorHandler } from '@api/middleware/error.middleware.js';

function buildApp() {
  const app = express();
  // A stand-in for a real write route: employees CRUD (Phase 4) will use this
  // exact pattern. Testing it here proves the middleware, independent of any
  // route that doesn't exist yet.
  app.post('/admin-only', authenticate, authorize('HR_MANAGER'), (_req, res) => {
    res.status(201).json({ ok: true });
  });
  app.use(errorHandler);
  return app;
}

describe('authorize', () => {
  it('allows a user with an allowed role through', async () => {
    const token = signToken({ sub: 'user-1', role: 'HR_MANAGER' });

    const response = await request(buildApp())
      .post('/admin-only')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(201);
  });

  it('returns 403 for a VIEWER on an HR_MANAGER-only route', async () => {
    const token = signToken({ sub: 'user-2', role: 'VIEWER' });

    const response = await request(buildApp())
      .post('/admin-only')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: 'Forbidden',
      code: 'FORBIDDEN',
      requestId: 'unknown',
    });
  });

  it('returns 401 (from authenticate) rather than 403 when there is no token at all', async () => {
    const response = await request(buildApp()).post('/admin-only');

    expect(response.status).toBe(401);
  });
});
