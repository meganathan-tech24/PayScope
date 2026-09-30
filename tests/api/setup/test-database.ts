// Picks the database the integration suite may touch. Tests truncate every table
// after each test, so anything that is not clearly a test database is refused.
export function resolveTestDatabaseUrl(candidate: string | undefined): string {
  if (!candidate) {
    throw new Error('TEST_DATABASE_URL is not set (see .env.example)');
  }

  const name = new URL(candidate).pathname.replace(/^\//, '');
  if (!name.endsWith('_test')) {
    throw new Error(
      `Refusing to run integration tests against "${name}": the database name must end in _test`,
    );
  }

  return candidate;
}
