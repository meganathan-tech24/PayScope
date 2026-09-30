import { LogLevel as PrismaLogLevel, type Prisma } from '../../generated/prisma/client.js';
import type { LogEntry, LogLevel } from '../../lib/logging/log-transport.js';
import { prisma } from '../prisma.js';

const LEVEL_MAP: Record<LogLevel, PrismaLogLevel> = {
  debug: PrismaLogLevel.DEBUG,
  info: PrismaLogLevel.INFO,
  warn: PrismaLogLevel.WARN,
  error: PrismaLogLevel.ERROR,
  fatal: PrismaLogLevel.FATAL,
};

export async function createApplicationLog(entry: LogEntry): Promise<void> {
  await prisma.applicationLog.create({
    data: {
      level: LEVEL_MAP[entry.level],
      message: entry.message,
      errorCode: entry.errorCode,
      service: entry.service,
      environment: entry.environment,
      requestId: entry.requestId,
      method: entry.method,
      path: entry.path,
      statusCode: entry.statusCode,
      userId: entry.userId,
      stack: entry.stack,
      metadata: entry.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
