/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

/**
 * Vite config for frontend-boilerplate.
 *
 * - Dev server port: 5173 (matches the project's runtime which exposes the
 *   frontend on https://boilerplate-fe-...cloud.serendiped.com and locally on
 *   http://localhost:5173). The previous value of 4051 was inconsistent with
 *   the runtime and broke the local ↔ dev URL pairing (FE 5173 ↔ BE 4000).
 *
 * - allowedHosts: defaults to permissive (`true`) so the cloud preview
 *   environment (which uses dynamic hostnames) works out of the box. For
 *   stricter local setups, set `VITE_ALLOWED_HOSTS=host1.com,host2.com` in
 *   `.env` and Vite will restrict to that comma-separated list. See:
 *   https://vite.dev/config/server-options.html#server-allowedhosts
 *
 * - cors: enabled so the dev server accepts cross-origin requests from the
 *   backend (handy when proxying is not in use).
 *
 * The same file is used by Vitest (`vitest run --config vite.config.ts`) — we
 * declare the test block here so the JSdom environment and globals resolve
 * correctly when running `npm test`.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const allowedHostsRaw = env.VITE_ALLOWED_HOSTS;
  const allowedHosts =
    !allowedHostsRaw || allowedHostsRaw === 'true'
      ? true
      : allowedHostsRaw
          .split(',')
          .map((h) => h.trim())
          .filter(Boolean);

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        // `@dashboards/contracts` é um pacote LINKADO (file:../shared/contracts)
        // que importa `ajv`/`ajv-formats`. No build, o rolldown resolve esses
        // imports a partir do real-path do pacote (shared/contracts/dist) e não
        // os encontra (ficam hoisted no node_modules do FE). Apontamos o
        // specifier para o diretório do pacote no node_modules do app (onde
        // ambos existem, pois são deps transitivas de contracts) — preservando
        // subpaths e destravando o `vite build`.
        ajv: path.resolve(__dirname, 'node_modules/ajv'),
        'ajv-formats': path.resolve(__dirname, 'node_modules/ajv-formats'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts,
      cors: true,
    },
    preview: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts,
      cors: true,
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      server: {
        deps: {
          /*
           * O design system precisa passar pelo pipeline do Vite nos testes,
           * em vez de ser externalizado para o resolvedor do Node.
           *
           * Motivo concreto: componentes do DS fazem `lazy(() =>
           * import('../Tooltip/Tooltip'))` — caminho relativo SEM extensão.
           * O Vite (dev e build) resolve isso; o ESM do Node, não. Sem esta
           * linha, qualquer teste que renderize um componente com carregamento
           * preguiçoso (ex.: `Timestamp` com dica de hora exata) quebra com
           * "Cannot find module .../Tooltip/Tooltip" — um erro do AMBIENTE DE
           * TESTE que parece um erro do produto, e que empurraria a solução
           * errada (desligar a dica na tela para o teste passar).
           */
          inline: [/@astryxdesign\/core/],
        },
      },
    },
  };
});
