import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadEnvFile } from '@api/lib/load-env.js';

import { resolveTestDatabaseUrl } from './test-database.js';

export default function setup(): void {
  // Precedence for the database: the real environment (CI), then this machine's .env
  // (its own port and password), then the .env.test template. Everything else in
  // .env.test (NODE_ENV, secrets, silent logs) always wins, so tests behave the same everywhere.
  loadEnvFile('.env');
  const machineTestUrl = process.env.TEST_DATABASE_URL;
  loadEnvFile('.env.test', { override: true });

  const testUrl = resolveTestDatabaseUrl(machineTestUrl ?? process.env.TEST_DATABASE_URL);
  process.env.TEST_DATABASE_URL = testUrl;
  process.env.DATABASE_URL = testUrl;

  const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../apps/api');

  execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    cwd: apiRoot,
    stdio: 'inherit',
    env: process.env,
  });
}
