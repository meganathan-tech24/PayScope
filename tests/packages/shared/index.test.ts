import { describe, expect, it } from 'vitest';

import { clampPageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@shared/index.js';

describe('clampPageSize', () => {
  it('falls back to the default for non-positive or non-finite input', () => {
    expect(clampPageSize(0)).toBe(DEFAULT_PAGE_SIZE);
    expect(clampPageSize(-5)).toBe(DEFAULT_PAGE_SIZE);
    expect(clampPageSize(Number.NaN)).toBe(DEFAULT_PAGE_SIZE);
  });

  it('passes through valid values below the max', () => {
    expect(clampPageSize(10)).toBe(10);
  });

  it('caps values above the max', () => {
    expect(clampPageSize(1000)).toBe(MAX_PAGE_SIZE);
  });
});
