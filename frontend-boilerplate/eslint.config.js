import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';

/**
 * ESLint flat config for frontend-boilerplate.
 *
 * Aligned with the backend boilerplate's flat-config style (recommended
 * sets for JS + TS) plus React Hooks + React Refresh for component files.
 *
 * `eslint-config-prettier` is appended last so its rule overrides win and
 * Prettier handles all formatting concerns (no fights with rules like
 * `indent`, `quotes`, `semi`, etc.).
 */
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  prettier,
]);
