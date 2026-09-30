import { ZodError } from 'zod';

import { Prisma } from '../../generated/prisma/client.js';

import { AppError } from './app-error.js';

export interface ClassifiedError {
  statusCode: number;
  code: string;
  message: string;
  isOperational: boolean;
}

export function classifyError(error: unknown): ClassifiedError {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      isOperational: error.isOperational,
    };
  }

  if (error instanceof ZodError) {
    const message = error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    return { statusCode: 400, code: 'VALIDATION_ERROR', message, isOperational: true };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return {
        statusCode: 409,
        code: 'CONFLICT',
        message: 'A record with this value already exists',
        isOperational: true,
      };
    }
    return {
      statusCode: 500,
      code: 'DATABASE_ERROR',
      message: 'Internal server error',
      isOperational: false,
    };
  }

  if (isMalformedJsonError(error)) {
    return {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Malformed JSON in request body',
      isOperational: true,
    };
  }

  return {
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
    isOperational: false,
  };
}

function isMalformedJsonError(error: unknown): error is SyntaxError {
  return (
    error instanceof SyntaxError &&
    'status' in error &&
    (error as { status?: unknown }).status === 400 &&
    'body' in error
  );
}
