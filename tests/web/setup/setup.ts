import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';

// Each test starts with no stubbed fetch and no stored session.
afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});
