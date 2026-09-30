import type { PrismaClient } from '../generated/prisma/client.js';
import { hashPassword } from '../lib/password.js';

import { generateEmployees } from './employee-generator.js';
import { DEFAULT_EMPLOYEE_COUNT, DEFAULT_SEED } from './reference-data.js';

export const BATCH_SIZE = 1000;
// The default is documented in the README as a public demo credential.
export const DEFAULT_DEMO_PASSWORD = 'DemoPassw0rd!';

export const DEMO_USERS = [
  { name: 'Demo HR Manager (demo account)', email: 'hr.demo@acme.example', role: 'HR_MANAGER' },
  { name: 'Demo Viewer (demo account)', email: 'viewer.demo@acme.example', role: 'VIEWER' },
] as const;

export interface SeedSummary {
  employees: number;
  demoUsers: string[];
  durationMs: number;
}

export async function runSeed(options: {
  prisma: PrismaClient;
  count?: number;
  seed?: number;
  demoPassword?: string;
}): Promise<SeedSummary> {
  const startedAt = Date.now();
  const count = options.count ?? DEFAULT_EMPLOYEE_COUNT;
  const rows = generateEmployees({ count, seed: options.seed ?? DEFAULT_SEED });
  // Hash once, outside the transaction: bcrypt is slow and needs no database.
  const passwordHash = await hashPassword(options.demoPassword ?? DEFAULT_DEMO_PASSWORD);

  // One transaction: a failure part-way leaves the previous data untouched
  // rather than an emptied table. The 5s default is far too short for 10k rows.
  await options.prisma.$transaction(
    async (tx) => {
      await tx.employee.deleteMany();
      for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
        await tx.employee.createMany({ data: rows.slice(offset, offset + BATCH_SIZE) });
      }

      const stored = await tx.employee.count();
      if (stored !== rows.length) {
        throw new Error(`Seed stored ${stored} employees, expected ${rows.length}`);
      }

      for (const user of DEMO_USERS) {
        await tx.user.upsert({
          where: { email: user.email },
          update: { name: user.name, passwordHash, role: user.role },
          create: { name: user.name, email: user.email, passwordHash, role: user.role },
        });
      }
    },
    { timeout: 120_000, maxWait: 10_000 },
  );

  return {
    employees: rows.length,
    demoUsers: DEMO_USERS.map((user) => user.email),
    durationMs: Date.now() - startedAt,
  };
}
