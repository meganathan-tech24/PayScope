import { nodeConfig } from '@payscope/eslint-config/node.js';

export default [
  ...nodeConfig,
  {
    // Path aliases to the code under test count as internal imports.
    settings: { 'import/internal-regex': '^@(api|web|shared|shared-types)/' },
  },
];
