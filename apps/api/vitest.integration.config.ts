import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.integration.test.ts'],
    globalSetup: ['./src/test/integration-global-setup.ts'],
    setupFiles: ['./src/test/integration-setup.ts'],
    fileParallelism: false,
  },
});
