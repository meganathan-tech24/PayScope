import { describe, expect, it, vi } from 'vitest';

import type { PrismaClient } from '../../generated/prisma/client.js';
import { BATCH_SIZE, DEFAULT_DEMO_PASSWORD, DEMO_USERS, runSeed } from '../seed.js';

function fakePrisma(storedCount?: number) {
  const calls: string[] = [];
  const tx = {
    employee: {
      deleteMany: vi.fn(async () => void calls.push('deleteMany')),
      createMany: vi.fn(
        async ({ data }: { data: unknown[] }) => void calls.push(`createMany:${data.length}`),
      ),
      count: vi.fn(async () => storedCount ?? -1),
    },
    user: { upsert: vi.fn(async (_args: unknown) => void calls.push('upsert')) },
  };
  const $transaction = vi.fn(async (fn: (client: typeof tx) => Promise<void>, _options?: unknown) =>
    fn(tx),
  );
  return { prisma: { $transaction } as unknown as PrismaClient, tx, calls, $transaction };
}

describe('runSeed', () => {
  it('clears employees first, then inserts in batches, inside one transaction', async () => {
    const { prisma, calls, $transaction } = fakePrisma(2500);

    const summary = await runSeed({ prisma, count: 2500 });

    expect($transaction).toHaveBeenCalledTimes(1);
    expect(calls.slice(0, 4)).toEqual([
      'deleteMany',
      `createMany:${BATCH_SIZE}`,
      `createMany:${BATCH_SIZE}`,
      'createMany:500',
    ]);
    expect(summary.employees).toBe(2500);
  });

  it('raises the transaction timeout well above the 5s default', async () => {
    const { prisma, $transaction } = fakePrisma(10);

    await runSeed({ prisma, count: 10 });

    const options = $transaction.mock.calls[0]?.[1] as unknown as { timeout: number };
    expect(options.timeout).toBeGreaterThanOrEqual(60_000);
  });

  it('upserts an HR_MANAGER and a VIEWER demo user with a hashed password', async () => {
    const { prisma, tx } = fakePrisma(5);

    await runSeed({ prisma, count: 5 });

    expect(tx.user.upsert).toHaveBeenCalledTimes(2);
    const roles = tx.user.upsert.mock.calls.map(
      ([args]) => (args as { create: { role: string } }).create.role,
    );
    expect(roles.sort()).toEqual(['HR_MANAGER', 'VIEWER']);
    for (const [args] of tx.user.upsert.mock.calls) {
      const { create } = args as { create: { passwordHash: string } };
      expect(create.passwordHash).not.toBe(DEFAULT_DEMO_PASSWORD);
      expect(create.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    }
    expect(DEMO_USERS.every((user) => user.name.includes('demo account'))).toBe(true);
  });

  it('uses a custom demo password when given', async () => {
    const { prisma, tx } = fakePrisma(1);

    await runSeed({ prisma, count: 1, demoPassword: 'Another-Passw0rd!' });

    const { create } = tx.user.upsert.mock.calls[0]?.[0] as unknown as {
      create: { passwordHash: string };
    };
    expect(create.passwordHash).toMatch(/^\$2[aby]\$12\$/);
  });

  it('fails (rolling the transaction back) if the stored count is not what was generated', async () => {
    const { prisma } = fakePrisma(9);

    await expect(runSeed({ prisma, count: 10 })).rejects.toThrow(/stored 9 employees, expected 10/);
  });
});
