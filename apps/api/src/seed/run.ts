import { config } from '../app/config/config.js';
import { prisma } from '../database/prisma.js';
import { logger } from '../lib/logging/logger.js';

import { assertSeedAllowed } from './guard.js';
import { runSeed } from './seed.js';

async function main(): Promise<void> {
  assertSeedAllowed({
    NODE_ENV: config.NODE_ENV,
    ALLOW_PRODUCTION_SEED: process.env.ALLOW_PRODUCTION_SEED,
  });

  logger.info('Seeding employees and demo users');
  const summary = await runSeed({ prisma, demoPassword: process.env.DEMO_USER_PASSWORD });
  logger.info('Seed complete', { metadata: { ...summary } });
}

main()
  .catch((error: unknown) => {
    logger.error('Seed failed', {
      stack: error instanceof Error ? error.stack : undefined,
      metadata: { reason: error instanceof Error ? error.message : String(error) },
    });
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
