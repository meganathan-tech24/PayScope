import { afterEach } from 'vitest';

import { prisma } from '../database/prisma.js';

afterEach(async () => {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "Employee", "User", "ApplicationLog" RESTART IDENTITY CASCADE',
  );
});
