import { describe, expect, it } from 'vitest';

import { loginBodySchema, registerBodySchema } from '@api/modules/auth/auth.schema.js';

describe('registerBodySchema', () => {
  it('accepts a valid payload', () => {
    const result = registerBodySchema.safeParse({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'Passw0rd!',
    });

    expect(result.success).toBe(true);
  });

  it('trims and lowercases the email', () => {
    const result = registerBodySchema.parse({
      name: 'Ada Lovelace',
      email: '  Ada@Example.COM  ',
      password: 'Passw0rd!',
    });

    expect(result.email).toBe('ada@example.com');
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = registerBodySchema.safeParse({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'Sh0rt!',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a password with no uppercase letter', () => {
    const result = registerBodySchema.safeParse({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'password1',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a password with no digit', () => {
    const result = registerBodySchema.safeParse({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'Password',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a missing name', () => {
    const result = registerBodySchema.safeParse({
      email: 'ada@example.com',
      password: 'Passw0rd!',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a client-supplied role field instead of silently dropping it', () => {
    const result = registerBodySchema.safeParse({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'Passw0rd!',
      role: 'HR_MANAGER',
    });

    expect(result.success).toBe(false);
  });
});

describe('loginBodySchema', () => {
  it('accepts a valid payload', () => {
    const result = loginBodySchema.safeParse({ email: 'ada@example.com', password: 'anything' });

    expect(result.success).toBe(true);
  });

  it('does not enforce password strength on login (a match check, not a policy)', () => {
    const result = loginBodySchema.safeParse({ email: 'ada@example.com', password: 'x' });

    expect(result.success).toBe(true);
  });

  it('rejects an unexpected extra field', () => {
    const result = loginBodySchema.safeParse({
      email: 'ada@example.com',
      password: 'anything',
      role: 'HR_MANAGER',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a missing email', () => {
    const result = loginBodySchema.safeParse({ password: 'anything' });

    expect(result.success).toBe(false);
  });
});
