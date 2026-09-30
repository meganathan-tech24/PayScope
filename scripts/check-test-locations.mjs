// Fails when a test file or __tests__ folder exists outside the root tests/ package.
// Uses git so untracked-but-not-ignored files are caught before they are committed.
import { execFileSync } from 'node:child_process';

const TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/;

const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
  encoding: 'utf8',
})
  .split('\n')
  .filter(Boolean);

const offenders = files.filter(
  (file) =>
    !file.startsWith('tests/') && (TEST_FILE.test(file) || file.split('/').includes('__tests__')),
);

if (offenders.length > 0) {
  console.error('Test files must live in the root tests/ package (@payscope/tests). Found:');
  for (const file of offenders) console.error(`  ${file}`);
  process.exit(1);
}

console.log(`Test location check passed (${files.length} files scanned).`);
