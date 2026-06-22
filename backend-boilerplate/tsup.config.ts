import { defineConfig } from 'tsup';

export default defineConfig({
  // server.ts é o entry principal. Os módulos de domínio (src/modules/*) são
  // entries SEPARADOS para que cada um vire um arquivo em dist/modules/*/index.js
  // — assim o @fastify/autoload os encontra em runtime tanto em dev (src) quanto
  // no build (dist). Adicionar um novo módulo é auto-incluído por este glob.
  entry: ['src/server.ts', 'src/modules/**/*.ts'],
  format: ['cjs'],
  dts: false,
  clean: true,
  sourcemap: true,
  minify: false,
  target: 'node20',
  outDir: 'dist',
});
