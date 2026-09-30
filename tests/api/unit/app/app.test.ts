import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '@api/app/app.js';

describe('createApp', () => {
  it('returns a JSON 404 envelope for an unmatched route, not the default HTML page', async () => {
    const response = await request(createApp()).get('/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body).toEqual({
      success: false,
      message: expect.stringContaining('/does-not-exist'),
      code: 'NOT_FOUND',
      requestId: expect.stringMatching(/^req_/),
    });
  });

  it('sets security headers via helmet', async () => {
    const response = await request(createApp()).get('/does-not-exist');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('allows the configured CORS origin', async () => {
    const response = await request(createApp())
      .get('/does-not-exist')
      .set('Origin', 'http://localhost:5173');

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('exposes the download file name and the request id to the browser', async () => {
    const response = await request(createApp())
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:5173');

    expect(response.headers['access-control-expose-headers']).toBe(
      'Content-Disposition,X-Request-Id',
    );
  });

  it('sets the X-Request-Id response header', async () => {
    const response = await request(createApp()).get('/does-not-exist');

    expect(response.headers['x-request-id']).toMatch(/^req_/);
  });

  it('returns a 400 validation envelope for malformed JSON bodies', async () => {
    const response = await request(createApp())
      .post('/api/v1/health')
      .set('Content-Type', 'application/json')
      .send('{not valid json');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });
});
