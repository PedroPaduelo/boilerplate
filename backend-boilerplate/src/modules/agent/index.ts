/**
 * Módulo `agent` — motor de IA integrado ao boilerplate.
 *
 * Funcionalidades:
 * - POST /agent/chat/:conversationId — SSE stream da resposta do agente
 * - GET /agent/conversations — lista conversas do usuário
 * - POST /agent/conversations — cria nova conversa
 * - GET /agent/conversations/:id — detalhe de uma conversa com mensagens
 * - DELETE /agent/conversations/:id — deleta conversa
 * - GET /agent/health — verifica se o agent está configurado
 *
 * O agent usa:
 * - @ai-sdk/anthropic (Claude) com cache breakpoints
 * - Tools do MCP (list_connections, run_query, create_chart, etc.) diretamente
 * - Skills (.skills/*.md ou futuro: API de skills)
 * - Persistência no banco (Conversation + ChatMessage)
 * - Memória: o histórico da conversa é carregado do banco a cada turno
 */

import type { FastifyPluginAsync } from 'fastify';
import { auth } from '@/middlewares/auth';
import { chatRoute } from './routes/chat.js';
import { conversationsRoutes } from './routes/conversations.js';
import { healthRoute } from './routes/health.js';

const agentModule: FastifyPluginAsync = async (app) => {
  // Auth (JWT) em todas as rotas do módulo
  await app.register(auth);
  app.register(chatRoute);
  app.register(conversationsRoutes);
  app.register(healthRoute);
};

export default agentModule;
