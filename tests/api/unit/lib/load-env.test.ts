import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { findRepoRoot, loadEnvFile } from '@api/lib/load-env.js';

describe('findRepoRoot', () => {
  it('finds the folder holding pnpm-workspace.yaml from any depth below it', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'payscope-root-'));
    const deep = path.join(root, 'apps', 'api', 'dist');
    fs.mkdirSync(deep, { recursive: true });
    fs.writeFileSync(path.join(root, 'pnpm-workspace.yaml'), 'packages: []\n');

    expect(findRepoRoot(deep)).toBe(root);
    expect(findRepoRoot(root)).toBe(root);
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('returns undefined when there is no workspace above', () => {
    const lonely = fs.mkdtempSync(path.join(os.tmpdir(), 'payscope-none-'));

    expect(findRepoRoot(lonely)).toBeUndefined();
    fs.rmSync(lonely, { recursive: true, force: true });
  });

  it('finds this repository from the API source folder', () => {
    const root = findRepoRoot(path.dirname(new URL(import.meta.url).pathname));

    expect(root && fs.existsSync(path.join(root, 'apps/api/package.json'))).toBe(true);
  });
});

describe('loadEnvFile', () => {
  const saved = { NODE_ENV: process.env.NODE_ENV, PORT: process.env.PORT };

  afterEach(() => {
    process.env.NODE_ENV = saved.NODE_ENV;
    if (saved.PORT === undefined) delete process.env.PORT;
    else process.env.PORT = saved.PORT;
  });

  it('reads the env file outside production', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.PORT;

    loadEnvFile('.env.test', { override: true });

    expect(process.env.PORT).toBe('4001');
  });

  it('reads no file in production: configuration comes from the real environment only', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.PORT;

    loadEnvFile('.env.test', { override: true });

    expect(process.env.PORT).toBeUndefined();
  });
});
