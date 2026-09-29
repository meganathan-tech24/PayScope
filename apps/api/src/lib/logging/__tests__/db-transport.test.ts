import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../database/repositories/application-log.repository.js', () => ({
  createApplicationLog: vi.fn(),
}));
vi.mock('../console-transport.js', () => ({ consoleTransport: { write: vi.fn() } }));

import { createApplicationLog } from '../../../database/repositories/application-log.repository.js';
import { consoleTransport } from '../console-transport.js';
import { dbTransport } from '../db-transport.js';

describe('dbTransport', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('never throws when the database write fails, and falls back to the console transport', async () => {
    vi.mocked(createApplicationLog).mockRejectedValueOnce(new Error('connection refused'));

    // This is the guarantee the spec requires: a logging failure must never
    // affect the caller (e.g. the error handler sending the original response).
    expect(() => dbTransport.write({ level: 'error', message: 'boom' })).not.toThrow();

    await flushMicrotasks();

    expect(consoleTransport.write).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'error',
        message: 'Failed to persist application log to the database',
        metadata: expect.objectContaining({ originalMessage: 'boom' }),
      }),
    );
  });

  it('persists entries at or above the configured minimum level (warn by default)', async () => {
    vi.mocked(createApplicationLog).mockResolvedValueOnce(undefined);

    dbTransport.write({ level: 'warn', message: 'something happened' });

    await flushMicrotasks();

    expect(createApplicationLog).toHaveBeenCalledTimes(1);
  });

  it('skips entries below the configured minimum level', async () => {
    dbTransport.write({ level: 'debug', message: 'noisy' });

    await flushMicrotasks();

    expect(createApplicationLog).not.toHaveBeenCalled();
  });
});

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}
