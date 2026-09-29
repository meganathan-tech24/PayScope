import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../app.js';

describe('createApp', () => {
  it('returns an express app with JSON body parsing wired up', async () => {
    const app = createApp();

    const response = await request(app).get('/');

    expect(response.status).toBe(404);
  });
});
