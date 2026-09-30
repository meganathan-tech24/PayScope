import { config as loadDotenv } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Prisma 7 no longer loads .env files. Run from apps/api, the shared .env lives at the
// repo root; override is off so a real environment (CI, .env.test setup) always wins.
loadDotenv({ path: '../../.env', quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    // Tolerant on purpose: `prisma generate` (postinstall) needs no database, and must
    // not fail on a fresh clone before .env exists. migrate/db commands still need it.
    url: process.env.DATABASE_URL ?? '',
  },
});
