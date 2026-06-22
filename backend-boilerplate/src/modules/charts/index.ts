import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

/**
 * Módulo `charts` — TRILHA T-B.
 *
 * Plugin auto-descoberto (ver `src/http/modules-loader.ts` e `src/modules/README.md`).
 * Superfície prevista (doc 31): CRUD draft + publish/unpublish de gráficos.
 * A rota `/_status` é só marcador de scaffold — remova ao implementar.
 */
const chartsModule: FastifyPluginAsync = async (app) => {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/charts/_status',
    {
      schema: {
        tags: ['Charts'],
        summary: 'Scaffold marker (T-B) — substituir pela implementação real',
        response: {
          200: z.object({ module: z.string(), status: z.string() }),
        },
      },
    },
    async () => ({ module: 'charts', status: 'scaffolded' }),
  );
};

export default chartsModule;
