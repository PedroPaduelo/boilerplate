import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

/**
 * Módulo `share` — TRILHA T-B.
 *
 * Plugin auto-descoberto (ver `src/http/modules-loader.ts` e `src/modules/README.md`).
 * Superfície prevista (doc 31): POST /share, DELETE /share/:id e a rota PÚBLICA
 * `GET /public/:token` (SEM auth — guard por token válido/não-expirado).
 * A rota `/_status` é só marcador de scaffold — remova ao implementar.
 */
const shareModule: FastifyPluginAsync = async (app) => {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/share/_status',
    {
      schema: {
        tags: ['Share'],
        summary: 'Scaffold marker (T-B) — substituir pela implementação real',
        response: {
          200: z.object({ module: z.string(), status: z.string() }),
        },
      },
    },
    async () => ({ module: 'share', status: 'scaffolded' }),
  );
};

export default shareModule;
