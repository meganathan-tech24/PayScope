import { describe, expect, it } from 'vitest';

import { resolveTestDatabaseUrl } from '@tests/api/setup/test-database.js';

describe('resolveTestDatabaseUrl', () => {
  it('accepts a URL for a database named *_test, on any host and port', () => {
    const url = 'postgresql://user:secret@localhost:5433/payscope_test';

    expect(resolveTestDatabaseUrl(url)).toBe(url);
  });

  it('refuses the dev database, whose tables the suite would truncate', () => {
    expect(() =>
      resolveTestDatabaseUrl('postgresql://user:secret@localhost:5433/payscope'),
    ).toThrow(/must end in _test/);
  });

  it('refuses a missing URL', () => {
    expect(() => resolveTestDatabaseUrl(undefined)).toThrow(/TEST_DATABASE_URL is not set/);
    expect(() => resolveTestDatabaseUrl('')).toThrow(/TEST_DATABASE_URL is not set/);
  });

  it('does not put the password in the error message', () => {
    expect(() => resolveTestDatabaseUrl('postgresql://user:secret@localhost/payscope')).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining('secret') }),
    );
  });
});
