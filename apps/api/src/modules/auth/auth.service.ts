import type { User } from '@prisma/client';

import { ConflictError, UnauthorizedError } from '../../lib/errors/app-error.js';
import { signToken } from '../../lib/jwt.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';

import { createUser, findUserByEmail, findUserById } from './auth.repository.js';
import type { LoginInput, RegisterInput } from './auth.schema.js';
import type { AuthResult, AuthUser } from './auth.types.js';

// Computed once at module load, not per request, so an unknown-email login
// and a wrong-password login both pay for one bcrypt compare and take
// statistically indistinguishable time.
const DUMMY_HASH = await hashPassword('dummy-password-for-timing-safety-only');

function toAuthUser(user: User): AuthUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new ConflictError('An account with this email already exists', 'EMAIL_TAKEN');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await createUser({ name: input.name, email: input.email, passwordHash });
  const token = signToken({ sub: user.id, role: user.role });

  return { user: toAuthUser(user), token };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await findUserByEmail(input.email);
  const isValid = await verifyPassword(input.password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !isValid) {
    throw new UnauthorizedError('Invalid credentials', 'AUTH_INVALID_CREDENTIALS');
  }

  const token = signToken({ sub: user.id, role: user.role });
  return { user: toAuthUser(user), token };
}

export async function getCurrentUser(userId: string): Promise<AuthUser> {
  const user = await findUserById(userId);
  if (!user) {
    throw new UnauthorizedError('Invalid or expired token');
  }
  return toAuthUser(user);
}
