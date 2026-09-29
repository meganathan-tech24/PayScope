import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import { NotFoundError, ValidationError } from '../app-error.js';
import { classifyError } from '../classify-error.js';

describe('classifyError', () => {
  it('passes AppError instances through unchanged', () => {
    const result = classifyError(new NotFoundError('Employee not found', 'EMPLOYEE_NOT_FOUND'));

    expect(result).toEqual({
      statusCode: 404,
      code: 'EMPLOYEE_NOT_FOUND',
      message: 'Employee not found',
      isOperational: true,
    });
  });

  it('maps a ZodError to a 400 with a joined message', () => {
    const zodError = new ZodError([
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'undefined',
        path: ['email'],
        message: 'Required',
      },
    ]);

    const result = classifyError(zodError);

    expect(result.statusCode).toBe(400);
    expect(result.code).toBe('VALIDATION_ERROR');
    expect(result.message).toContain('email: Required');
    expect(result.isOperational).toBe(true);
  });

  it('maps a Prisma unique-constraint error (P2002) to a 409 conflict', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '6.1.0',
    });

    const result = classifyError(prismaError);

    expect(result).toEqual({
      statusCode: 409,
      code: 'CONFLICT',
      message: 'A record with this value already exists',
      isOperational: true,
    });
  });

  it('maps other Prisma errors to a generic 500 without leaking the DB error text', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('connection terminated', {
      code: 'P1001',
      clientVersion: '6.1.0',
    });

    const result = classifyError(prismaError);

    expect(result.statusCode).toBe(500);
    expect(result.code).toBe('DATABASE_ERROR');
    expect(result.message).toBe('Internal server error');
    expect(result.isOperational).toBe(false);
  });

  it('maps a malformed-JSON body-parser SyntaxError to a 400', () => {
    const syntaxError = Object.assign(new SyntaxError('Unexpected token'), {
      status: 400,
      body: '{bad json',
    });

    const result = classifyError(syntaxError);

    expect(result.statusCode).toBe(400);
    expect(result.code).toBe('VALIDATION_ERROR');
  });

  it('maps an unrecognized error to a generic 500 and marks it non-operational', () => {
    const result = classifyError(new Error('something exploded'));

    expect(result).toEqual({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      isOperational: false,
    });
  });

  it('handles a thrown non-Error value', () => {
    const result = classifyError('just a string');

    expect(result.statusCode).toBe(500);
    expect(result.code).toBe('INTERNAL_ERROR');
  });

  it('a ValidationError from application code stays a 400', () => {
    const result = classifyError(new ValidationError('email is required'));

    expect(result.statusCode).toBe(400);
    expect(result.code).toBe('VALIDATION_ERROR');
    expect(result.message).toBe('email is required');
  });
});
