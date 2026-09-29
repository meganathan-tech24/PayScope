import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config as loadDotenv } from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../..');

export function loadEnvFile(filename: string, options: { override?: boolean } = {}): void {
  loadDotenv({ path: path.join(repoRoot, filename), override: options.override ?? false });
}
