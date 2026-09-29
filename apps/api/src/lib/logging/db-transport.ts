import { config } from '../../app/config/config.js';
import { createApplicationLog } from '../../database/repositories/application-log.repository.js';

import { consoleTransport } from './console-transport.js';
import type { LogEntry, LogLevel, LogTransport } from './log-transport.js';

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
};

export const dbTransport: LogTransport = {
  write(entry) {
    if (LEVEL_RANK[entry.level] < LEVEL_RANK[config.LOG_DB_MIN_LEVEL]) {
      return;
    }

    void persist(entry);
  },
};

async function persist(entry: LogEntry): Promise<void> {
  try {
    await createApplicationLog(entry);
  } catch (error) {
    // Logging failures must never affect the original request/response. Fall back
    // to the console transport so the entry isn't silently lost.
    consoleTransport.write({
      level: 'error',
      message: 'Failed to persist application log to the database',
      service: entry.service,
      environment: entry.environment,
      requestId: entry.requestId,
      metadata: {
        originalMessage: entry.message,
        originalLevel: entry.level,
        error: error instanceof Error ? error.message : String(error),
      },
    });
  }
}
