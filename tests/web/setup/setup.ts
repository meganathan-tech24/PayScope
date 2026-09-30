import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';

// jsdom has no object URLs, which the CSV export uses to save a file.
URL.createObjectURL ??= () => 'blob:test';
URL.revokeObjectURL ??= () => undefined;

// Each test starts with no stubbed fetch and no stored session.
afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});
