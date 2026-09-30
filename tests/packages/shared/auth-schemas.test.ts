import { describe, expect, it } from 'vitest';

import { loginBodySchema, registerBodySchema } from '@shared/auth.js';

describe('shared auth schemas', () => {
  const register = { name: 'Ada', email: 'ada@example.com', password: 'Passw0rd!' };

  it('registers as a VIEWER by default and accepts both roles', () => {
    expect(registerBodySchema.parse(register).role).toBe('VIEWER');
    expect(registerBodySchema.parse({ ...register, role: 'HR_MANAGER' }).role).toBe('HR_MANAGER');
  });

  it('rejects an unknown role, weak passwords and extra fields', () => {
    expect(registerBodySchema.safeParse({ ...register, role: 'ADMIN' }).success).toBe(false);
    expect(registerBodySchema.safeParse({ ...register, password: 'short' }).success).toBe(false);
    expect(registerBodySchema.safeParse({ ...register, extra: 1 }).success).toBe(false);
  });

  it('logs in with an email and any non-empty password, and nothing else', () => {
    expect(loginBodySchema.safeParse({ email: 'ada@example.com', password: 'x' }).success).toBe(
      true,
    );
    expect(loginBodySchema.safeParse({ email: 'ada@example.com', password: '' }).success).toBe(
      false,
    );
    expect(
      loginBodySchema.safeParse({ email: 'ada@example.com', password: 'x', role: 'VIEWER' })
        .success,
    ).toBe(false);
  });
});
