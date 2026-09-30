import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// The signed-in pages are loaded on demand, and the first load in a test file has to be
// compiled, so waiting for them needs more than the 1 s default.
configure({ asyncUtilTimeout: 4000 });

// jsdom has no object URLs, which the CSV export uses to save a file.
URL.createObjectURL ??= () => 'blob:test';
URL.revokeObjectURL ??= () => undefined;

// Recharts measures its container with ResizeObserver, which jsdom does not have. This
// stub never reports a size, so charts render nothing; tests read the data tables instead.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Each test starts with no stubbed fetch and no stored session.
afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});
