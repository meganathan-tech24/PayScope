import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/lib/logging/console-transport.js', () => ({ consoleTransport: { write: vi.fn() } }));
vi.mock('@api/lib/logging/db-transport.js', () => ({ dbTransport: { write: vi.fn() } }));

import { consoleTransport } from '@api/lib/logging/console-transport.js';
import { dbTransport } from '@api/lib/logging/db-transport.js';
import { logger } from '@api/lib/logging/logger.js';

describe('logger', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('redacts sensitive fields before dispatching to every transport', () => {
    logger.warn('login attempt', {
      metadata: { password: 'hunter2', email: 'a@b.com' },
    });

    const expectedEntry = expect.objectContaining({
      metadata: { password: '[REDACTED]', email: 'a@b.com' },
    });
    expect(consoleTransport.write).toHaveBeenCalledWith(expectedEntry);
    expect(dbTransport.write).toHaveBeenCalledWith(expectedEntry);
  });

  it('stamps every entry with service and environment', () => {
    logger.info('server started');

    expect(consoleTransport.write).toHaveBeenCalledWith(
      expect.objectContaining({ service: 'api', environment: expect.any(String) }),
    );
  });

  it('passes through requestId, method, path, statusCode, userId, errorCode, and stack', () => {
    logger.error('request failed', {
      requestId: 'req_123',
      method: 'GET',
      path: '/api/v1/health',
      statusCode: 500,
      userId: 'user-1',
      errorCode: 'INTERNAL_ERROR',
      stack: 'Error: boom\n at x',
    });

    expect(consoleTransport.write).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'req_123',
        method: 'GET',
        path: '/api/v1/health',
        statusCode: 500,
        userId: 'user-1',
        errorCode: 'INTERNAL_ERROR',
        stack: 'Error: boom\n at x',
      }),
    );
  });
});
