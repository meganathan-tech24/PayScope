import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadEnvFile } from '@api/lib/load-env.js';

export default function setup(): void {
  loadEnvFile('.env.test', { override: true });

  const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../apps/api');

  execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    cwd: apiRoot,
    stdio: 'inherit',
    env: process.env,
  });
}
