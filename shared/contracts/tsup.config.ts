import { defineConfig } from 'tsup';

/**
 * Build DUAL (ESM + CJS) + declarations, para o pacote ser consumido tanto pelo
 * backend (tsconfig `module: node16`, tipicamente CJS) quanto pelo frontend
 * (Vite/bundler, ESM) sem fricção de interop ESM/CJS.
 */
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  outDir: 'dist',
});
