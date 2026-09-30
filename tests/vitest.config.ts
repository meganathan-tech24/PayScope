import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');

// Tests live here, source lives in apps/* and packages/*. Aliases mirror tsconfig `paths`.
const alias = {
  '@tests': here,
  '@api': path.join(repo, 'apps/api/src'),
  '@web': path.join(repo, 'apps/web/src'),
  '@shared': path.join(repo, 'packages/shared/src'),
  '@shared-types': path.join(repo, 'packages/types/src'),
};

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'api-unit',
          environment: 'node',
          include: ['api/unit/**/*.test.ts'],
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'api-integration',
          environment: 'node',
          include: ['api/integration/**/*.test.ts'],
          globalSetup: ['./api/setup/integration-global-setup.ts'],
          setupFiles: ['./api/setup/integration-setup.ts'],
          fileParallelism: false,
        },
      },
      {
        plugins: [react()],
        resolve: { alias, dedupe: ['react', 'react-dom'] },
        test: {
          name: 'web',
          environment: 'jsdom',
          include: ['web/**/*.test.{ts,tsx}'],
          setupFiles: ['./web/setup/setup.ts'],
          globals: true,
          // Form tests type into many fields with userEvent and pages load lazily; under a
          // full parallel run that can pass the 5 s default and fail a correct test.
          testTimeout: 15_000,
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'packages',
          environment: 'node',
          include: ['packages/**/*.test.ts'],
        },
      },
    ],
  },
});
