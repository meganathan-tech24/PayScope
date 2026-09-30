import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../auth.repository.js', () => ({
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  createUser: vi.fn(),
}));

import type { User } from '../../../generated/prisma/client.js';
import { ConflictError, UnauthorizedError } from '../../../lib/errors/app-error.js';
import * as passwordLib from '../../../lib/password.js';
import { createUser, findUserByEmail, findUserById } from '../auth.repository.js';
import { getCurrentUser, login, register } from '../auth.service.js';

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    passwordHash: '$2b$12$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWX',
    role: 'HR_MANAGER',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('register', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('hashes the password before persisting it — never stores it in plain text', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);
    vi.mocked(createUser).mockImplementation(async (data) =>
      buildUser({ email: data.email, name: data.name, passwordHash: data.passwordHash }),
    );

    await register({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'Passw0rd!' });

    const createCall = vi.mocked(createUser).mock.calls[0]?.[0];
    expect(createCall?.passwordHash).not.toBe('Passw0rd!');
    expect(createCall?.passwordHash).toMatch(/^\$2[aby]\$12\$/);
  });

  it('returns the user and a token, never the password hash', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);
    vi.mocked(createUser).mockImplementation(async (data) =>
      buildUser({ email: data.email, name: data.name, passwordHash: data.passwordHash }),
    );

    const result = await register({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'Passw0rd!',
    });

    expect(result.user).toEqual({
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'HR_MANAGER',
    });
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(typeof result.token).toBe('string');
  });

  it('throws a 409 conflict when the pre-check finds an existing user', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(buildUser());

    await expect(
      register({ name: 'Ada', email: 'ada@example.com', password: 'Passw0rd!' }),
    ).rejects.toThrow(ConflictError);
    expect(createUser).not.toHaveBeenCalled();
  });

  it('propagates the repository-level conflict when a race loses at the unique constraint', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);
    vi.mocked(createUser).mockRejectedValue(
      new ConflictError('An account with this email already exists', 'EMAIL_TAKEN'),
    );

    await expect(
      register({ name: 'Ada', email: 'ada@example.com', password: 'Passw0rd!' }),
    ).rejects.toThrow(ConflictError);
  });
});

describe('login', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns a token on a correct password', async () => {
    const passwordHash = await passwordLib.hashPassword('Passw0rd!');
    vi.mocked(findUserByEmail).mockResolvedValue(buildUser({ passwordHash }));

    const result = await login({ email: 'ada@example.com', password: 'Passw0rd!' });

    expect(typeof result.token).toBe('string');
    expect(result.user.email).toBe('ada@example.com');
  });

  it('rejects a wrong password with the generic invalid-credentials error', async () => {
    const passwordHash = await passwordLib.hashPassword('Passw0rd!');
    vi.mocked(findUserByEmail).mockResolvedValue(buildUser({ passwordHash }));

    await expect(login({ email: 'ada@example.com', password: 'WrongPassword!' })).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it('rejects an unknown email with the identical generic error (no user enumeration)', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);

    const wrongPassword = login({ email: 'ada@example.com', password: 'WrongPassword!' }).catch(
      (error: unknown) => error,
    );
    const unknownEmail = login({ email: 'nobody@example.com', password: 'anything' }).catch(
      (error: unknown) => error,
    );

    const [wrongPasswordError, unknownEmailError] = await Promise.all([
      wrongPassword,
      unknownEmail,
    ]);

    expect(wrongPasswordError).toBeInstanceOf(UnauthorizedError);
    expect(unknownEmailError).toBeInstanceOf(UnauthorizedError);
    expect((wrongPasswordError as UnauthorizedError).message).toBe(
      (unknownEmailError as UnauthorizedError).message,
    );
    expect((wrongPasswordError as UnauthorizedError).code).toBe('AUTH_INVALID_CREDENTIALS');
    expect((unknownEmailError as UnauthorizedError).code).toBe('AUTH_INVALID_CREDENTIALS');
  });

  it('still runs a password comparison for an unknown email (dummy-hash timing defense)', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);
    const compareSpy = vi.spyOn(passwordLib, 'verifyPassword');

    await login({ email: 'nobody@example.com', password: 'anything' }).catch(() => undefined);

    expect(compareSpy).toHaveBeenCalledTimes(1);
    const [, comparedHash] = compareSpy.mock.calls[0] ?? [];
    expect(comparedHash).not.toBe('anything');
  });
});

describe('getCurrentUser', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns the mapped user for a valid id', async () => {
    vi.mocked(findUserById).mockResolvedValue(buildUser());

    const user = await getCurrentUser('user-1');

    expect(user).toEqual({
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'HR_MANAGER',
    });
  });

  it('throws unauthorized when the user no longer exists', async () => {
    vi.mocked(findUserById).mockResolvedValue(null);

    await expect(getCurrentUser('deleted-user')).rejects.toThrow(UnauthorizedError);
  });
});
