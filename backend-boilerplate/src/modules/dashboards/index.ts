import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

/**
 * Módulo `dashboards` — TRILHA T-B.
 *
 * Plugin auto-descoberto (ver `src/http/modules-loader.ts` e `src/modules/README.md`).
 * Superfície prevista (doc 31): CRUD `/dashboards` (+ GET por modo) + publish/unpublish.
 * OBS: `POST /dashboards/:id/data` (hidratação) é do módulo `data` (T-C), NÃO aqui.
 * A rota `/_status` é só marcador de scaffold — remova ao implementar.
 */
const dashboardsModule: FastifyPluginAsync = async (app) => {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/dashboards/_status',
    {
      schema: {
        tags: ['Dashboards'],
        summary: 'Scaffold marker (T-B) — substituir pela implementação real',
        response: {
          200: z.object({ module: z.string(), status: z.string() }),
        },
      },
    },
    async () => ({ module: 'dashboards', status: 'scaffolded' }),
  );
};

export default dashboardsModule;
