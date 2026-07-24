import { defineConfig } from 'tsup';

/**
 * Build DUAL (ESM + CJS) + declarations, para o pacote ser consumido tanto pelo
 * backend (tsconfig `module: node16`, tipicamente CJS) quanto pelo frontend
 * (Vite/bundler, ESM) sem fricção de interop ESM/CJS.
 */
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  // Bundla ajv/ajv-formats DENTRO do dist para o pacote ficar self-contained
  // quando consumido via `file:` (symlink) pelo BE/FE. Sem isso, o Node resolve
  // `require('ajv')` a partir do real-path do pacote (shared/contracts) e falha
  // com "Cannot find module 'ajv'". Como o dist é versionado (ver .gitignore),
  // o artefato publicado não depende de node_modules do contracts.
  noExternal: ['ajv', 'ajv-formats'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  outDir: 'dist',
});
