import pino from 'pino';

import { config } from '../../app/config/config.js';

import type { LogTransport } from './log-transport.js';

const pinoLogger = pino({
  level: config.LOG_LEVEL,
  transport: config.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
});

export const consoleTransport: LogTransport = {
  write(entry) {
    const { level, message, ...context } = entry;
    pinoLogger[level](context, message);
  },
};
