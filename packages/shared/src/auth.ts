import { z } from 'zod';

import { ROLES } from './roles.js';

// Shared by the API (server-side validation) and the web app (client-side
// validation), so both enforce exactly the same rules.

export const emailSchema = z.string().trim().toLowerCase().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const registerBodySchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(200),
    email: emailSchema,
    password: passwordSchema,
    // Least privilege: a client that omits the role gets a VIEWER. Anything outside
    // the enum (including a different case) is a validation error, never coerced.
    role: z.enum(ROLES).default('VIEWER'),
  })
  .strict();

export const loginBodySchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerBodySchema>;
export type LoginInput = z.infer<typeof loginBodySchema>;
