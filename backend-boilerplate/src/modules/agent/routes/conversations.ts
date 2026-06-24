/**
 * CRUD de conversas.
 * GET    /agent/conversations
 * POST   /agent/conversations
 * GET    /agent/conversations/:id
 * PATCH  /agent/conversations/:id
 * DELETE /agent/conversations/:id
 */
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
} from '../services/conversation.js';

export const conversationsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/agent/conversations', async (request, reply) => {
    const userId = await request.getCurrentUserId();
    const conversations = await listConversations(userId);
    return reply.send({ conversations });
  });

  app.post(
    '/agent/conversations',
    {
      schema: {
        body: z.object({
          title: z.string().max(200).optional(),
        }),
      },
    },
    async (request, reply) => {
      const userId = await request.getCurrentUserId();
      const { title } = (request as any).body ?? {};
      const conv = await createConversation({ userId, title });
      return reply.code(201).send(conv);
    },
  );

  app.get('/agent/conversations/:id', async (request, reply) => {
    const userId = await request.getCurrentUserId();
    const { id } = (request as any).params;
    const conv = await getConversation(id, userId);
    if (!conv) return reply.code(404).send({ error: 'Conversation not found' });
    return reply.send(conv);
  });

  app.patch(
    '/agent/conversations/:id',
    {
      schema: {
        body: z.object({
          title: z.string().min(1).max(200),
        }),
      },
    },
    async (request, reply) => {
      const userId = await request.getCurrentUserId();
      const { id } = (request as any).params;
      const { title } = (request as any).body;

      const conv = await getConversation(id, userId);
      if (!conv) return reply.code(404).send({ error: 'Conversation not found' });

      const updated = await prisma.conversation.update({
        where: { id },
        data: { title },
      });
      return reply.send(updated);
    },
  );

  app.delete('/agent/conversations/:id', async (request, reply) => {
    const userId = await request.getCurrentUserId();
    const { id } = (request as any).params;
    const deleted = await deleteConversation(id, userId);
    if (!deleted) return reply.code(404).send({ error: 'Conversation not found' });
    return reply.code(204).send();
  });
};
