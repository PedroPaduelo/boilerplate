import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

/**
 * Módulo `export` — TRILHA T-J.
 *
 * Plugin auto-descoberto (ver `src/http/modules-loader.ts` e `src/modules/README.md`).
 * Superfície prevista (doc 31): `POST /export/dashboards/:id/pdf` (PDF server-side
 * headless — rota /print + Chromium + fila). A rota `/_status` é só marcador de scaffold.
 */
const exportModule: FastifyPluginAsync = async (app) => {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/export/_status',
    {
      schema: {
        tags: ['Export'],
        summary: 'Scaffold marker (T-J) — substituir pela implementação real',
        response: {
          200: z.object({ module: z.string(), status: z.string() }),
        },
      },
    },
    async () => ({ module: 'export', status: 'scaffolded' }),
  );
};

export default exportModule;
