import type { ZodType, output } from 'zod';

import { ApiError, NetworkError } from '../../../services/http';

export type FieldErrors = Partial<Record<string, string>>;

// First message per field, keyed by the field name.
export function validateFields<S extends ZodType>(
  schema: S,
  values: unknown,
): { data: output<S>; errors?: undefined } | { data?: undefined; errors: FieldErrors } {
  const result = schema.safeParse(values);
  if (result.success) return { data: result.data };

  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? '');
    errors[field] ??= issue.message;
  }
  return { errors };
}

export interface DescribedError {
  /** Shown above the form. */
  banner?: string;
  /** Shown next to one field. */
  field?: { name: string; message: string };
}

// One place that decides what a failed sign-in or sign-up says to the user.
// A wrong password and an unknown email get the same words, like the API.
export function describeAuthError(error: unknown): DescribedError {
  if (error instanceof NetworkError) {
    return { banner: 'Could not reach the server. Check your connection and try again.' };
  }
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return { banner: 'Too many attempts. Please wait a few minutes and try again.' };
    }
    if (error.status === 409) {
      return {
        field: {
          name: 'email',
          message: 'An account with this email already exists. Try signing in instead.',
        },
      };
    }
    if (error.status === 401) return { banner: 'Email or password is incorrect.' };
    if (error.status === 400) return { banner: error.message };
  }
  return { banner: 'Something went wrong. Please try again.' };
}
