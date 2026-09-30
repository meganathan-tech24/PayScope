import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

// Builds the API (always, so a stale dist cannot pass) and runs the production-start smoke
// check against the test database: the bundle fails fast without its environment, answers
// /api/v1/health, and stops cleanly on SIGTERM.
describe('production start (integration)', () => {
  it('builds the API and starts the built bundle the way a host does', () => {
    const build = spawnSync('pnpm', ['--filter', '@payscope/api', 'build'], {
      cwd: root,
      encoding: 'utf8',
      timeout: 120_000,
    });
    expect(build.status, `${build.stdout}\n${build.stderr}`).toBe(0);

    const smoke = spawnSync(process.execPath, [path.join(root, 'scripts/smoke-production.mjs')], {
      cwd: root,
      env: process.env,
      encoding: 'utf8',
      timeout: 100_000,
    });

    const output = `${smoke.stdout}\n${smoke.stderr}`;
    expect(smoke.status, output).toBe(0);
    expect(output).toContain('exited with code 1 and named the missing variables');
    expect(output).toContain('GET /api/v1/health answered 200 with the database up');
    expect(output).toContain('SIGTERM stopped it cleanly (exit code 0)');
    expect(output).toContain('Production start smoke check passed');
  }, 240_000);
});
