import { Prisma, type User } from '@prisma/client';

import { prisma } from '../../database/prisma.js';
import { ConflictError } from '../../lib/errors/app-error.js';

export function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
}

export async function createUser(data: CreateUserData): Promise<User> {
  try {
    return await prisma.user.create({
      data: { ...data, role: 'HR_MANAGER' },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictError('An account with this email already exists', 'EMAIL_TAKEN');
    }
    throw error;
  }
}
