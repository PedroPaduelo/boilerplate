import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

/**
 * Módulo `connections` — TRILHA T-A.
 *
 * Plugin auto-descoberto por `@fastify/autoload` (ver `src/http/modules-loader.ts`).
 * Esta é a CASCA da Fase 0: a trilha T-A implementa o CRUD + test + schema +
 * query (preview) AQUI DENTRO, sem tocar em `server.ts`.
 *
 * Como estender (convenção — ver `src/modules/README.md`):
 *  - Adicione handlers neste `index.ts`, OU crie `src/modules/connections/routes/*.ts`
 *    (cada um exportando uma função que recebe `app`) e registre-os a partir daqui.
 *  - Declare paths ABSOLUTOS (`/connections`, `/connections/:id`, ...).
 *  - Use sempre `app.withTypeProvider<ZodTypeProvider>()` + `schema.tags` p/ Swagger.
 *  - A rota `/_status` abaixo é só um marcador de scaffold — pode remover ao implementar.
 *
 * Superfície prevista (doc 31): POST/GET/PATCH/DELETE /connections,
 * POST /connections/:id/test, GET /connections/:id/schema, POST /connections/:id/query.
 */
const connectionsModule: FastifyPluginAsync = async (app) => {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/connections/_status',
    {
      schema: {
        tags: ['Connections'],
        summary: 'Scaffold marker (T-A) — substituir pela implementação real',
        response: {
          200: z.object({ module: z.string(), status: z.string() }),
        },
      },
    },
    async () => ({ module: 'connections', status: 'scaffolded' }),
  );
};

export default connectionsModule;
