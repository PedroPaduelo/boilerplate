import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

/**
 * Módulo `departments` — TRILHA T-B.
 *
 * Plugin auto-descoberto (ver `src/http/modules-loader.ts` e `src/modules/README.md`).
 * Superfície prevista (doc 31): CRUD de departamento + membership.
 * A rota `/_status` é só marcador de scaffold — remova ao implementar.
 */
const departmentsModule: FastifyPluginAsync = async (app) => {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/departments/_status',
    {
      schema: {
        tags: ['Departments'],
        summary: 'Scaffold marker (T-B) — substituir pela implementação real',
        response: {
          200: z.object({ module: z.string(), status: z.string() }),
        },
      },
    },
    async () => ({ module: 'departments', status: 'scaffolded' }),
  );
};

export default departmentsModule;
