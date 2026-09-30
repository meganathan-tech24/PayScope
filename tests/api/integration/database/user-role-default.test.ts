import { describe, expect, it } from 'vitest';

import { prisma } from '@api/database/prisma.js';

describe('User.role default (integration)', () => {
  it('gives a row inserted without a role the least-privileged VIEWER role', async () => {
    await prisma.$executeRaw`
      INSERT INTO "User" ("id", "name", "email", "passwordHash", "updatedAt")
      VALUES ('default-role-user', 'No Role', 'norole@example.com', 'x', NOW())`;

    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'norole@example.com' } });

    expect(user.role).toBe('VIEWER');
  });
});
