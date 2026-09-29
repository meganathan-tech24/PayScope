import { describe, expect, it } from 'vitest';

import { redactSensitive } from '../redact.js';

describe('redactSensitive', () => {
  it('redacts password, token, passwordHash, authorization, and cookie keys', () => {
    const input = {
      password: 'hunter2',
      token: 'abc.def.ghi',
      passwordHash: '$2b$12$abcdefg',
      authorization: 'Bearer abc',
      cookie: 'session=1',
    };

    expect(redactSensitive(input)).toEqual({
      password: '[REDACTED]',
      token: '[REDACTED]',
      passwordHash: '[REDACTED]',
      authorization: '[REDACTED]',
      cookie: '[REDACTED]',
    });
  });

  it('redacts sensitive keys at any nesting depth, matching req.headers.authorization', () => {
    const input = {
      req: { headers: { authorization: 'Bearer abc', 'content-type': 'application/json' } },
    };

    expect(redactSensitive(input)).toEqual({
      req: { headers: { authorization: '[REDACTED]', 'content-type': 'application/json' } },
    });
  });

  it('redacts sensitive keys inside arrays', () => {
    const input = [{ password: 'hunter2' }, { email: 'a@b.com' }];

    expect(redactSensitive(input)).toEqual([{ password: '[REDACTED]' }, { email: 'a@b.com' }]);
  });

  it('is case-insensitive on key names', () => {
    const input = { Password: 'hunter2', PASSWORDHASH: 'x' };

    expect(redactSensitive(input)).toEqual({ Password: '[REDACTED]', PASSWORDHASH: '[REDACTED]' });
  });

  it('leaves non-sensitive fields untouched', () => {
    const input = { email: 'a@b.com', role: 'HR_MANAGER', count: 3 };

    expect(redactSensitive(input)).toEqual(input);
  });

  it('does not mutate the original object', () => {
    const input = { password: 'hunter2' };

    redactSensitive(input);

    expect(input.password).toBe('hunter2');
  });
});
