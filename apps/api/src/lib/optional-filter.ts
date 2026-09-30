import { z } from 'zod';

// A blank filter (e.g. a cleared search box) means "no filter", not a 400.
export const optionalFilter = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    schema.optional(),
  );
