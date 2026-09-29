export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  level: LogLevel;
  message: string;
  service?: string;
  environment?: string;
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  userId?: string;
  errorCode?: string;
  stack?: string;
  metadata?: Record<string, unknown>;
}

export interface LogTransport {
  write(entry: LogEntry): void;
}
