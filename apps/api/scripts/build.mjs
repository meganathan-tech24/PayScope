// Bundles the API into a single file that plain `node` can run.
//
// @payscope/shared and @payscope/types are TypeScript source that Node cannot load, so they
// (and the generated Prisma client) are inlined. Every real dependency stays external and
// resolves from apps/api/node_modules at runtime, which keeps Prisma's runtime, pg and
// friends exactly as their packages ship them.
//
// Usage: node scripts/build.mjs [outfile]   (default: dist/server.js)
import { readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outfile = path.resolve(process.argv[2] ?? path.join(root, 'dist/server.js'));
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

const external = Object.keys(pkg.dependencies ?? {})
  .filter((name) => !name.startsWith('@payscope/'))
  .flatMap((name) => [name, `${name}/*`]);

// A stale dist (for example old compiler output) must not survive next to the bundle.
if (outfile === path.join(root, 'dist/server.js')) {
  rmSync(path.join(root, 'dist'), { recursive: true, force: true });
}

await build({
  entryPoints: [path.join(root, 'src/server.ts')],
  outfile,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node24',
  sourcemap: true,
  external,
  // Some inlined CommonJS code calls require(); give the ES module one.
  banner: {
    js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
  },
  logLevel: 'info',
});
