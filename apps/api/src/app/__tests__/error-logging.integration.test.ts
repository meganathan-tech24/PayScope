import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { prisma } from '../../database/prisma.js';
import { createApp } from '../app.js';

describe('error handling + async logging (integration)', () => {
  it('persists a real ApplicationLog row for an unmatched route, with a matching requestId', async () => {
    const response = await request(createApp()).get('/api/v1/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: expect.stringContaining('/api/v1/does-not-exist'),
      code: 'NOT_FOUND',
      requestId: expect.stringMatching(/^req_/),
    });

    const logRow = await waitForApplicationLog(response.body.requestId);

    expect(logRow).not.toBeNull();
    expect(logRow?.level).toBe('ERROR');
    expect(logRow?.statusCode).toBe(404);
    expect(logRow?.errorCode).toBe('NOT_FOUND');
    expect(logRow?.method).toBe('GET');
  });
});

async function waitForApplicationLog(requestId: string, attempts = 20) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const row = await prisma.applicationLog.findFirst({ where: { requestId } });
    if (row) {
      return row;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return null;
}
