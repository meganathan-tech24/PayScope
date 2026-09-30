export interface Closable {
  close(callback: (error?: Error) => void): unknown;
  closeIdleConnections?(): void;
}

export interface ShutdownDeps {
  server: Closable;
  /** Releases the database connections. */
  disconnect: () => Promise<void>;
  exit: (code: number) => void;
  log: (message: string, metadata?: Record<string, unknown>) => void;
  forceAfterMs?: number;
}

// On SIGTERM (what Render sends on every deploy) or SIGINT: stop accepting requests, let the
// running ones finish, release the database, and exit 0. If that takes too long, exit 1
// rather than hang. A second signal while shutting down is ignored.
export function createShutdown({
  server,
  disconnect,
  exit,
  log,
  forceAfterMs = 10_000,
}: ShutdownDeps): (signal: string) => void {
  let started = false;

  return (signal) => {
    if (started) return;
    started = true;
    log('Shutting down', { signal });

    const timer = setTimeout(() => {
      log('Shutdown timed out, exiting', { forceAfterMs });
      exit(1);
    }, forceAfterMs);
    timer.unref();

    server.close((error) => {
      void (async () => {
        try {
          await disconnect();
        } catch (failure) {
          log('Database disconnect failed during shutdown', { reason: String(failure) });
        }
        clearTimeout(timer);
        exit(error ? 1 : 0);
      })();
    });
    server.closeIdleConnections?.();
  };
}
