// Production-start smoke check.
//
// Runs the built API exactly as a host would (`node apps/api/dist/server.js`, real
// environment variables only, from a different working directory) and proves three things:
//   1. with the required variables missing it fails fast with a clear message,
//   2. with them set it starts and answers GET /api/v1/health with 200 and the database up,
//   3. SIGTERM stops it cleanly (exit code 0).
// Every wait has a timeout and no child process is ever left running.
//
// Needs `pnpm build` first and a test database in TEST_DATABASE_URL (from the environment,
// or from the repository's .env). Usage: node scripts/smoke-production.mjs
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundle = path.join(root, 'apps/api/dist/server.js');
const WATCHDOG_MS = 90_000;

const children = new Set();
const killAll = () => {
  for (const child of children) {
    try {
      child.kill('SIGKILL');
    } catch {
      // already gone
    }
  }
};
process.on('exit', killAll);

let failed = false;
const pass = (message) => console.log(`  ok   ${message}`);
const fail = (message) => {
  failed = true;
  console.error(`  FAIL ${message}`);
};

function testDatabaseUrl() {
  let url = process.env.TEST_DATABASE_URL;
  if (!url && fs.existsSync(path.join(root, '.env'))) {
    const line = fs
      .readFileSync(path.join(root, '.env'), 'utf8')
      .split('\n')
      .find((l) => l.startsWith('TEST_DATABASE_URL='));
    url = line
      ?.slice('TEST_DATABASE_URL='.length)
      .trim()
      .replace(/^["']|["']$/g, '');
  }
  if (!url) throw new Error('TEST_DATABASE_URL is not set (environment or .env)');
  const name = new URL(url).pathname.slice(1);
  if (!/^[\w-]+_test$/.test(name)) {
    throw new Error(
      `Refusing to use database "${name}": the name must be a plain name ending in _test`,
    );
  }
  return url;
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

// Starts the bundle in a different working directory, with exactly this environment.
function start(env) {
  const child = spawn(process.execPath, [bundle], {
    env,
    cwd: os.tmpdir(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  children.add(child);
  const state = { output: '', exit: undefined };
  const append = (chunk) => {
    state.output = (state.output + chunk).slice(-20_000);
  };
  child.stdout.on('data', append);
  child.stderr.on('data', append);
  state.done = new Promise((resolve) => {
    child.once('exit', (code, signal) => {
      state.exit = { code, signal };
      children.delete(child);
      resolve(state.exit);
    });
  });
  state.child = child;
  return state;
}

const within = (promise, ms) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve('timeout'), ms))]);

async function stop(state) {
  if (state.exit) return state.exit;
  state.child.kill('SIGTERM');
  const result = await within(state.done, 5_000);
  if (result === 'timeout') {
    state.child.kill('SIGKILL');
    await state.done;
    return 'timeout';
  }
  return result;
}

async function failsFastWithoutEnvironment() {
  console.log('1. Missing environment variables');
  const state = start({ NODE_ENV: 'production', PATH: process.env.PATH ?? '' });
  const result = await within(state.done, 10_000);
  if (result === 'timeout') {
    fail('the server kept running without its required configuration');
    await stop(state);
    return;
  }
  const clear =
    state.output.includes('Invalid environment configuration') &&
    ['DATABASE_URL', 'JWT_SECRET', 'CORS_ORIGIN'].every((name) => state.output.includes(name));
  if (result.code !== 0 && clear)
    pass(`exited with code ${result.code} and named the missing variables`);
  else
    fail(
      `expected a non-zero exit with a clear message, got code ${result.code}:\n${state.output}`,
    );
}

async function startsAndStopsCleanly() {
  console.log('2. Healthy start and clean stop');
  const port = await freePort();
  const state = start({
    NODE_ENV: 'production',
    PATH: process.env.PATH ?? '',
    DATABASE_URL: testDatabaseUrl(),
    JWT_SECRET: randomBytes(24).toString('hex'),
    CORS_ORIGIN: 'http://localhost:5173',
    PORT: String(port),
    LOG_LEVEL: 'info',
    LOG_DB_MIN_LEVEL: 'fatal',
  });

  const deadline = Date.now() + 30_000;
  let health;
  while (Date.now() < deadline && !state.exit) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/v1/health`, {
        signal: AbortSignal.timeout(2_000),
      });
      health = { status: response.status, body: await response.json() };
      if (health.status === 200) break;
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  if (health?.status === 200 && health.body?.data?.database === 'up') {
    pass('GET /api/v1/health answered 200 with the database up');
  } else {
    fail(
      `no healthy answer within 30 s (last: ${JSON.stringify(health)}, exit: ${JSON.stringify(state.exit)}):\n${state.output}`,
    );
  }

  const exit = await stop(state);
  if (exit === 'timeout') fail('the server ignored SIGTERM and had to be killed');
  else if (exit.code === 0) pass('SIGTERM stopped it cleanly (exit code 0)');
  else fail(`expected exit code 0 after SIGTERM, got ${JSON.stringify(exit)}:\n${state.output}`);
}

async function main() {
  if (!fs.existsSync(bundle)) {
    throw new Error(`${path.relative(root, bundle)} does not exist: run "pnpm build" first`);
  }
  console.log('Production start smoke check (node apps/api/dist/server.js)');
  await failsFastWithoutEnvironment();
  await startsAndStopsCleanly();
}

const watchdog = setTimeout(() => {
  console.error(`FAIL smoke check exceeded ${WATCHDOG_MS / 1000} s`);
  killAll();
  process.exit(1);
}, WATCHDOG_MS);

try {
  await main();
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
} finally {
  clearTimeout(watchdog);
  killAll();
}

if (failed) {
  console.error('Production start smoke check FAILED');
  process.exit(1);
}
console.log('Production start smoke check passed');
