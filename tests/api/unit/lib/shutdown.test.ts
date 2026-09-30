import { afterEach, describe, expect, it, vi } from 'vitest';

import { createShutdown, type Closable } from '@api/lib/shutdown.js';

function setup(
  overrides: { closeError?: Error; neverCloses?: boolean; disconnect?: () => Promise<void> } = {},
) {
  const exit = vi.fn();
  const log = vi.fn();
  const closeIdleConnections = vi.fn();
  const server: Closable = {
    close: vi.fn((callback: (error?: Error) => void) => {
      if (!overrides.neverCloses) callback(overrides.closeError);
    }),
    closeIdleConnections,
  };
  const disconnect = vi.fn(overrides.disconnect ?? (async () => undefined));
  const shutdown = createShutdown({ server, disconnect, exit, log, forceAfterMs: 1000 });
  return { shutdown, server, disconnect, exit, log, closeIdleConnections };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('createShutdown', () => {
  it('stops the server, releases the database and exits 0', async () => {
    const { shutdown, server, disconnect, exit, closeIdleConnections } = setup();

    shutdown('SIGTERM');
    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(0));

    expect(server.close).toHaveBeenCalledOnce();
    expect(closeIdleConnections).toHaveBeenCalledOnce();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('ignores a second signal while shutting down', async () => {
    const { shutdown, server, exit } = setup();

    shutdown('SIGTERM');
    shutdown('SIGINT');
    await vi.waitFor(() => expect(exit).toHaveBeenCalled());

    expect(server.close).toHaveBeenCalledOnce();
    expect(exit).toHaveBeenCalledOnce();
  });

  it('exits 1 when the server fails to close', async () => {
    const { shutdown, exit } = setup({ closeError: new Error('boom') });

    shutdown('SIGTERM');
    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(1));
  });

  it('still exits 0 when only the database disconnect fails, and says so', async () => {
    const { shutdown, exit, log } = setup({
      disconnect: async () => Promise.reject(new Error('gone')),
    });

    shutdown('SIGTERM');
    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(0));

    expect(log).toHaveBeenCalledWith(
      'Database disconnect failed during shutdown',
      expect.anything(),
    );
  });

  it('gives up after the time limit instead of hanging', () => {
    vi.useFakeTimers();
    const { shutdown, exit } = setup({ neverCloses: true });

    shutdown('SIGTERM');
    vi.advanceTimersByTime(999);
    expect(exit).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);

    expect(exit).toHaveBeenCalledWith(1);
  });
});
