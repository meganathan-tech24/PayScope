import type { User } from '@prisma/client';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../auth.repository.js', () => ({
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  createUser: vi.fn(),
}));
vi.mock('../../../lib/logging/console-transport.js', () => ({
  consoleTransport: { write: vi.fn() },
}));
vi.mock('../../../lib/logging/db-transport.js', () => ({
  dbTransport: { write: vi.fn() },
}));

import { createApp } from '../../../app/app.js';
import { consoleTransport } from '../../../lib/logging/console-transport.js';
import { dbTransport } from '../../../lib/logging/db-transport.js';
import { hashPassword } from '../../../lib/password.js';
import { createUser, findUserByEmail } from '../auth.repository.js';

const PLAIN_PASSWORD = 'Sup3rSecretPassw0rd!';

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    passwordHash: '$2b$12$placeholderplaceholderplaceholderplaceholderpla',
    role: 'HR_MANAGER',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Every write() call the real Logger (mocked transports, real redaction) made
// across an entire register/login request cycle, so we can assert the plain
// password and the issued token never appear anywhere in what got logged.
function everyLoggedString(): string {
  const consoleCalls = vi.mocked(consoleTransport.write).mock.calls;
  const dbCalls = vi.mocked(dbTransport.write).mock.calls;
  return JSON.stringify([...consoleCalls, ...dbCalls]);
}

describe('auth logging never contains plaintext credentials', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('across register, a duplicate register, and both login failure modes', async () => {
    const app = createApp();
    vi.mocked(findUserByEmail).mockResolvedValueOnce(null);
    vi.mocked(createUser).mockImplementationOnce(async (data) =>
      buildUser({ email: data.email, name: data.name, passwordHash: data.passwordHash }),
    );

    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: PLAIN_PASSWORD,
    });
    expect(registerResponse.status).toBe(201);
    const issuedToken: string = registerResponse.body.data.token;

    // Duplicate registration - triggers the ConflictError -> logger.error path.
    vi.mocked(findUserByEmail).mockResolvedValueOnce(buildUser());
    await request(app).post('/api/v1/auth/register').send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: PLAIN_PASSWORD,
    });

    // Wrong password - triggers the UnauthorizedError -> logger.error path.
    const realHash = await hashPassword(PLAIN_PASSWORD);
    vi.mocked(findUserByEmail).mockResolvedValueOnce(buildUser({ passwordHash: realHash }));
    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.com', password: 'totally-wrong-password' });

    // Unknown email - the dummy-hash path, also logger.error.
    vi.mocked(findUserByEmail).mockResolvedValueOnce(null);
    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'anything' });

    // Successful login - no error, no log call, but included for completeness.
    vi.mocked(findUserByEmail).mockResolvedValueOnce(buildUser({ passwordHash: realHash }));
    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.com', password: PLAIN_PASSWORD });

    const logged = everyLoggedString();

    expect(logged).not.toContain(PLAIN_PASSWORD);
    expect(logged).not.toContain('totally-wrong-password');
    expect(logged).not.toContain(issuedToken);
    // Sanity check that transports were actually exercised (the failure
    // paths above do log), so this test would fail loudly if nothing were
    // ever logged rather than passing vacuously.
    expect(
      vi.mocked(consoleTransport.write).mock.calls.length +
        vi.mocked(dbTransport.write).mock.calls.length,
    ).toBeGreaterThan(0);
  });
});
