/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
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
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
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
    },
  };
});
