import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

/**
 * Módulo `mcp` — TRILHA T-D (servidor MCP / tools).
 *
 * Plugin auto-descoberto (ver `src/http/modules-loader.ts` e `src/modules/README.md`).
 * Superfície prevista (doc 31): endpoint(s) do servidor MCP (HTTP streamable + auth)
 * expondo tools (list_connections, run_query, list_catalog, create/update/publish ...).
 * A rota `/_status` é só marcador de scaffold — remova ao implementar.
 */
const mcpModule: FastifyPluginAsync = async (app) => {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/mcp/_status',
    {
      schema: {
        tags: ['MCP'],
        summary: 'Scaffold marker (T-D) — substituir pela implementação real',
        response: {
          200: z.object({ module: z.string(), status: z.string() }),
        },
      },
    },
    async () => ({ module: 'mcp', status: 'scaffolded' }),
  );
};

export default mcpModule;
