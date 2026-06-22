import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

/**
 * Módulo `catalog` — TRILHAS T-I / T-D.
 *
 * Plugin auto-descoberto (ver `src/http/modules-loader.ts` e `src/modules/README.md`).
 * Superfície prevista (doc 31): `GET /catalog` — serve os manifestos do catálogo VIVO
 * gerados por `npm run build:catalog` em `src/catalog/catalog.manifests.json`
 * (consumidos pelo FE e pelo MCP). A rota `/_status` é só marcador de scaffold.
 */
const catalogModule: FastifyPluginAsync = async (app) => {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/catalog/_status',
    {
      schema: {
        tags: ['Catalog'],
        summary: 'Scaffold marker (T-I/T-D) — substituir pela implementação real',
        response: {
          200: z.object({ module: z.string(), status: z.string() }),
        },
      },
    },
    async () => ({ module: 'catalog', status: 'scaffolded' }),
  );
};

export default catalogModule;
