import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** @type {import("eslint").Linter.Config[]} */
export const baseConfig = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  importPlugin.flatConfigs.recommended,
  prettierConfig,
  {
    languageOptions: {
      globals: { ...globals.es2022 },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      // TypeScript already validates that imports resolve and exports exist;
      // eslint-plugin-import's resolver isn't configured for path/workspace
      // resolution and produces false positives (e.g. ESM-only packages).
      'import/no-unresolved': 'off',
      'import/named': 'off',
    },
  },
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', '.turbo/**', 'src/generated/**'],
  },
];

export default baseConfig;
