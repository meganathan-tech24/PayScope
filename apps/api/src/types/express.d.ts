import type { Role } from '../generated/prisma/client.js';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: { id: string; role: Role };
    }
  }
}

export {};
