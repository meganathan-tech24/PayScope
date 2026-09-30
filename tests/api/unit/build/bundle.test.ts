import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../apps/api');

// Builds the production bundle into a temporary file (not dist/) and reads it as text.
describe('production bundle (apps/api/scripts/build.mjs)', () => {
  let dir: string;
  let bundle: string;

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'payscope-bundle-'));
    const outfile = path.join(dir, 'server.js');
    execFileSync(process.execPath, [path.join(apiRoot, 'scripts/build.mjs'), outfile], {
      cwd: apiRoot,
      stdio: 'pipe',
    });
    bundle = fs.readFileSync(outfile, 'utf8');
  }, 60_000);

  afterAll(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('inlines the workspace packages, which Node cannot load as TypeScript source', () => {
    expect(bundle).not.toMatch(/from\s+["']@payscope\//);
    expect(bundle).not.toMatch(/require\(["']@payscope\//);
    // Code that lives in @payscope/shared is really in the file.
    expect(bundle).toContain('HR_MANAGER');
    expect(bundle).toContain('percentile_cont');
  });

  it('leaves real dependencies external, so they resolve from node_modules at runtime', () => {
    for (const dependency of ['express', 'zod', 'pino', '@prisma/adapter-pg']) {
      expect(bundle).toMatch(new RegExp(`from\\s+"${dependency}"`));
    }
    expect(bundle).toMatch(/from\s+"@prisma\/client\/runtime\/client"/);
  });

  it('imports no TypeScript file by name', () => {
    expect(bundle).not.toMatch(/from\s+["'][^"']+\.tsx?["']/);
  });
});
