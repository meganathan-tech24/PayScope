import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config as loadDotenv } from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * The repository root: the nearest folder above `startDir` that holds pnpm-workspace.yaml.
 * Walking up (rather than counting `..`) keeps it right whether this code runs from
 * src/lib under tsx or from the single bundled file in dist/.
 */
export function findRepoRoot(startDir: string): string | undefined {
  for (let dir = startDir; ; dir = path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return dir;
    if (path.dirname(dir) === dir) return undefined;
  }
}

export function loadEnvFile(filename: string, options: { override?: boolean } = {}): void {
  // Production takes its configuration from the real environment only, never from a file
  // that happens to sit on the disk (secrets come from the environment).
  if (process.env.NODE_ENV === 'production') return;

  const repoRoot = findRepoRoot(here);
  if (!repoRoot) return;

  // quiet: dotenv 17+ otherwise prints an "injected env" banner on every start.
  loadDotenv({
    path: path.join(repoRoot, filename),
    override: options.override ?? false,
    quiet: true,
  });
}
