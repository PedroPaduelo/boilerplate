/**
 * GET /agent/health — verifica se o motor do agente está configurado.
 */
import type { FastifyPluginAsync } from 'fastify';
import { env } from '@/lib/env';

export const healthRoute: FastifyPluginAsync = async (app) => {
  app.get('/agent/health', async (_req, reply) => {
    const hasKey = !!env.ANTHROPIC_API_KEY;
    return reply.send({
      configured: hasKey,
      model: env.AI_MODEL,
      baseURL: env.AI_BASE_URL || 'https://api.anthropic.com',
      message: hasKey ? 'OK' : 'ANTHROPIC_API_KEY not configured',
    });
  });
};
