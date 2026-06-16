import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

/**
 * ESLint flat config for backend-boilerplate.
 *
 * Aligned with the frontend boilerplate's flat-config style (recommended
 * sets for JS + TS) and extended with `globals.node` so Node-only globals
 * (`process`, `Buffer`, `__dirname`, etc.) don't trip `no-undef`.
 *
 * `eslint-config-prettier` is appended last so its rule overrides win and
 * Prettier handles all formatting concerns.
 *
 * NOTE: kept as `.mjs` (instead of `.js`) so Node parses it as ESM
 * regardless of any CJS-only `package.json` (this project uses CJS at
 * runtime via tsup/ts-jest, but ESLint 9 requires its config to be ESM).
 */
export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'uploads/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.es2023 },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'off',
    },
  },
  {
    files: ['tests/**/*.ts', '**/*.test.ts'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
    },
  },
  prettier
);
