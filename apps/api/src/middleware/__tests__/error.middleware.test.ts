import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/logging/logger.js', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), fatal: vi.fn() },
}));

import { NotFoundError, ValidationError } from '../../lib/errors/app-error.js';
import { logger } from '../../lib/logging/logger.js';
import { errorHandler, notFoundHandler } from '../error.middleware.js';
import { requestIdMiddleware } from '../request-id.middleware.js';

function buildApp() {
  const app = express();
  app.use(requestIdMiddleware);
  app.get('/boom', () => {
    throw new ValidationError('email is required');
  });
  app.get('/unexpected', () => {
    throw new Error('raw internal detail that must never reach the client');
  });
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe('errorHandler', () => {
  it('returns the standard error envelope for an AppError', async () => {
    const response = await request(buildApp()).get('/boom');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: 'email is required',
      code: 'VALIDATION_ERROR',
      requestId: expect.stringMatching(/^req_/),
    });
  });

  it('echoes the request id from the X-Request-Id header', async () => {
    const response = await request(buildApp()).get('/boom').set('X-Request-Id', 'client-xyz');

    expect(response.body.requestId).toBe('client-xyz');
  });

  it('never leaks the raw message of a non-operational error to the client', async () => {
    const response = await request(buildApp()).get('/unexpected');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      requestId: expect.stringMatching(/^req_/),
    });
    expect(JSON.stringify(response.body)).not.toContain('raw internal detail');
  });

  it('never includes a stack trace in the response body', async () => {
    const response = await request(buildApp()).get('/unexpected');

    expect(response.body.stack).toBeUndefined();
  });

  it('routes unmatched routes through the same envelope via notFoundHandler', async () => {
    const response = await request(buildApp()).get('/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('NOT_FOUND');
  });

  it('logs the real error message and stack even though the response is sanitized', async () => {
    await request(buildApp()).get('/unexpected');

    expect(logger.error).toHaveBeenCalledWith(
      'raw internal detail that must never reach the client',
      expect.objectContaining({
        statusCode: 500,
        errorCode: 'INTERNAL_ERROR',
        stack: expect.stringContaining('Error: raw internal detail'),
      }),
    );
  });

  it('logs and drops the connection instead of crashing when headers were already sent', async () => {
    const app = express();
    app.use(requestIdMiddleware);
    app.get('/stream', (_req, res, next) => {
      res.write('partial,');
      next(new Error('failed mid-stream'));
    });
    app.use(errorHandler);

    await expect(request(app).get('/stream')).rejects.toThrow();
    expect(logger.error).toHaveBeenCalledWith('failed mid-stream', expect.anything());
  });

  it('propagates NotFoundError thrown directly by application code', async () => {
    const app = express();
    app.use(requestIdMiddleware);
    app.get('/employees/:id', () => {
      throw new NotFoundError('Employee not found', 'EMPLOYEE_NOT_FOUND');
    });
    app.use(notFoundHandler);
    app.use(errorHandler);

    const response = await request(app).get('/employees/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.code).toBe('EMPLOYEE_NOT_FOUND');
  });
});
