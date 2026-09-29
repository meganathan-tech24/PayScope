import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from '../password.js';

describe('password hashing', () => {
  it('never returns the plain-text password as the hash', async () => {
    const hash = await hashPassword('Sup3rSecret!');

    expect(hash).not.toBe('Sup3rSecret!');
  });

  it('produces a bcrypt hash using cost factor 12', async () => {
    const hash = await hashPassword('Sup3rSecret!');

    expect(hash).toMatch(/^\$2[aby]\$12\$/);
  });

  it('verifies a correct password against its hash', async () => {
    const hash = await hashPassword('Sup3rSecret!');

    await expect(verifyPassword('Sup3rSecret!', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('Sup3rSecret!');

    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });

  it('produces a different hash for the same password each time (random salt)', async () => {
    const [hashA, hashB] = await Promise.all([
      hashPassword('Sup3rSecret!'),
      hashPassword('Sup3rSecret!'),
    ]);

    expect(hashA).not.toBe(hashB);
  });
});
