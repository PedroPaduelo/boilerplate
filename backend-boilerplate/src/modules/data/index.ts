import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

/**
 * Módulo `data` — TRILHA T-C (coração do render).
 *
 * Plugin auto-descoberto (ver `src/http/modules-loader.ts` e `src/modules/README.md`).
 * Superfície prevista (doc 31): `POST /dashboards/:id/data` (batch por dashboard) —
 * resolve cada bloco (cache Redis + fila BullMQ), responde queued/cache-hit e emite o
 * resultado via Socket.IO na sala `dashboard:{id}` (ver `src/socket/events/dashboard-room.ts`
 * e `SOCKET_EVENTS` de `@dashboards/contracts`).
 * A rota `/_status` é só marcador de scaffold — remova ao implementar.
 */
const dataModule: FastifyPluginAsync = async (app) => {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/data/_status',
    {
      schema: {
        tags: ['Data'],
        summary: 'Scaffold marker (T-C) — substituir pela implementação real',
        response: {
          200: z.object({ module: z.string(), status: z.string() }),
        },
      },
    },
    async () => ({ module: 'data', status: 'scaffolded' }),
  );
};

export default dataModule;
