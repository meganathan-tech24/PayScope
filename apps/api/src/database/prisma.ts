import { PrismaPg } from '@prisma/adapter-pg';

import { config } from '../app/config/config.js';
import { PrismaClient } from '../generated/prisma/client.js';

// Prisma 7 needs a driver adapter. pg has no connection timeout by default (Prisma 6 used
// 5s), and without one a health check against a dead database would hang, so set it.
const adapter = new PrismaPg({
  connectionString: config.DATABASE_URL,
  connectionTimeoutMillis: 5_000,
});

export const prisma = new PrismaClient({ adapter });
