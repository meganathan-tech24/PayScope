import type { Role } from '../../generated/prisma/client.js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResult {
  user: AuthUser;
  token: string;
}
