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
 * Aligned with the backend boilerplate's flat-config style: configs are
 * spread directly into the `defineConfig` array (no `extends` wrapper).
 * All rule sets are gated to TS/TSX files via a `files` glob so JS/CJS
 * config files (e.g. `vite.config.ts`, `static-server.cjs`,
 * `tailwind.config.js`) are left alone.
 *
 * `eslint-config-prettier` is appended last so its rule overrides win and
 * Prettier handles all formatting concerns (no fights with rules like
 * `indent`, `quotes`, `semi`, etc.).
 *
 * Implementation note: `tseslint.configs.recommended` is itself an array
 * of three configs (type-checked, stylistic, etc.), so we map each entry
 * to a `{ files, ...entry }` shape rather than spreading it into a
 * single object (which would create numeric keys ESLint rejects).
 */
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    ...js.configs.recommended,
  },
  ...tseslint.configs.recommended.map((entry) => ({
    files: ['**/*.{ts,tsx}'],
    ...entry,
  })),
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    ...reactHooks.configs.flat.recommended,
  },
  {
    files: ['**/*.{ts,tsx}'],
    ...reactRefresh.configs.vite,
  },
  {
    /**
     * Blocos do catálogo (render-engine): por convenção (doc 33), cada
     * `catalog/<type>/component.tsx` co-exporta o `Component` E a `definition`
     * (BlockDefinition) — o que o auto-registro via glob lê. Isso conflita com
     * react-refresh (que exige só componentes no arquivo). Fast refresh não é
     * relevante para esses módulos de catálogo, então desligamos a regra aqui.
     */
    files: ['src/shared/render-engine/catalog/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  prettier,
]);
