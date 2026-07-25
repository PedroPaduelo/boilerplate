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
import { chatRunRoute } from './routes/chat-run.js';
import { conversationsRoutes } from './routes/conversations.js';
import { healthRoute } from './routes/health.js';

const agentModule: FastifyPluginAsync = async (app) => {
  // Auth (JWT) em todas as rotas do módulo
  await app.register(auth);
  // Turno por socket, retomável (caminho novo). O SSE em `chatRoute` fica
  // registrado por compatibilidade, mas a interface usa este.
  app.register(chatRunRoute);
  app.register(chatRoute);
  app.register(conversationsRoutes);
  app.register(healthRoute);
};

export default agentModule;
