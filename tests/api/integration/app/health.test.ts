import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '@api/app/app.js';

describe('GET /api/v1/health (integration)', () => {
  it('returns 200 with database: up against the real test database', async () => {
    const response = await request(createApp()).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { status: 'ok', database: 'up' },
      meta: { requestId: expect.stringMatching(/^req_/) },
    });
  });
});
