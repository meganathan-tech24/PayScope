import { config } from '../../app/config/config.js';

import { consoleTransport } from './console-transport.js';
import { dbTransport } from './db-transport.js';
import type { LogEntry, LogLevel, LogTransport } from './log-transport.js';
import { redactSensitive } from './redact.js';

type LogContext = Omit<LogEntry, 'level' | 'message' | 'service' | 'environment'>;

class Logger {
  constructor(private readonly transports: LogTransport[]) {}

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  fatal(message: string, context?: LogContext): void {
    this.log('fatal', message, context);
  }

  private log(level: LogLevel, message: string, context: LogContext = {}): void {
    const entry = redactSensitive<LogEntry>({
      level,
      message,
      service: 'api',
      environment: config.NODE_ENV,
      ...context,
    });

    for (const transport of this.transports) {
      transport.write(entry);
    }
  }
}

export const logger = new Logger([consoleTransport, dbTransport]);
