/**
 * Turno do agente por SOCKET, com resposta retomável.
 *
 * - `POST /agent/chat/:id/run` dispara o turno e responde na hora (202). O
 *   trabalho segue no servidor e os pedaços saem pela sala `chat:{id}`.
 * - `GET  /agent/chat/:id/run` devolve o estado da execução: é o que permite
 *   RETOMAR — quem volta recebe o texto acumulado e o número do último pedaço,
 *   e continua escutando dali sem buraco nem repetição.
 *
 * Substitui o SSE: ali o texto só existia enquanto a conexão estivesse aberta,
 * então sair da tela no meio da resposta perdia tudo que viesse depois.
 */
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';
import type { ActorContext } from '@/lib/rbac';

import { addMessage } from '../services/conversation.js';
import { readRun, isRunning, clearRun, finishRun } from '../services/run-store.js';
import { abortRun } from '../services/run-control.js';
import { startTurnInBackground } from '../services/run-agent-background.js';
import { loadAllSkills, renderSkillsIndex } from '../skills/index.js';

let _systemPrompt: string | null = null;

async function getSystemPrompt(): Promise<string> {
  if (_systemPrompt) return _systemPrompt;
  try {
    _systemPrompt = await readFile(
      path.join(__dirname, '..', 'config', 'system-prompt.md'),
      'utf8',
    );
  } catch {
    _systemPrompt = 'Voce e um agente de IA que ajuda a criar dashboards e analisar dados.';
  }
  return _systemPrompt;
}

export const chatRunRoute: FastifyPluginAsync = async (app) => {
  /** Estado da execução em andamento (ou `null`). Usado ao (re)abrir a tela. */
  app.get<{ Params: { conversationId: string } }>(
    '/agent/chat/:conversationId/run',
    async (request, reply) => {
      const userId = await request.getCurrentUserId();
      const conv = await prisma.conversation.findFirst({
        where: { id: request.params.conversationId, userId },
      });
      if (!conv) return reply.code(404).send({ message: 'Conversation not found' });

      const state = await readRun(conv.id);
      return reply.send({ run: state ?? null });
    },
  );

  app.post<{
    Params: { conversationId: string };
    Body: { message: string };
  }>(
    '/agent/chat/:conversationId/run',
    { schema: { body: z.object({ message: z.string().min(1).max(10000) }) } },
    async (request, reply) => {
      const userId = await request.getCurrentUserId();

      const conv = await prisma.conversation.findFirst({
        where: { id: request.params.conversationId, userId },
      });
      if (!conv) return reply.code(404).send({ message: 'Conversation not found' });

      if (!env.ANTHROPIC_API_KEY) {
        return reply.code(503).send({ message: 'ANTHROPIC_API_KEY is not set.' });
      }

      // Dois turnos ao mesmo tempo na mesma conversa embaralhariam o histórico
      // e o texto acumulado. Quem já tem um rodando deve ATTACHAR nele (GET
      // acima), não iniciar outro.
      if (await isRunning(conv.id)) {
        return reply.code(409).send({
          message: 'Já existe uma resposta em andamento nesta conversa.',
          code: 'run_in_progress',
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });
      if (!user) return reply.code(401).send({ message: 'User not found' });

      const memberships = await prisma.departmentMembership.findMany({
        where: { userId },
        select: { departmentId: true },
      });
      const actor: ActorContext = {
        userId: user.id,
        role: user.role,
        departmentIds: memberships.map((m) => m.departmentId),
      };

      await addMessage(conv.id, { role: 'user', content: request.body.message });

      const base = await getSystemPrompt();
      const skills = await loadAllSkills();
      const indice = renderSkillsIndex(skills);

      const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      startTurnInBackground({
        conversationId: conv.id,
        userId,
        actor,
        userMessage: request.body.message,
        systemPrompt: indice ? `${base}\n${indice}` : base,
        runId,
      });

      // 202: aceito e em andamento. O conteúdo chega pela sala do socket.
      return reply.code(202).send({ runId, conversationId: conv.id });
    },
  );

  /**
   * PARA o turno em andamento — o botão "parar" da tela.
   *
   * Faz DUAS coisas, e a ordem de importância é esta:
   *   1. ENCERRA o run no Redis, o que LIBERA a conversa. Sem isto, parar
   *      deixava o turno marcado como `running` por até 30 min e toda mensagem
   *      seguinte batia em 409 ("já existe uma resposta em andamento") — o
   *      usuário parava a resposta e perdia a conversa até o TTL vencer.
   *   2. ABORTA a chamada ao provider, se o turno estiver rodando NESTE
   *      processo (economiza tokens e para as ferramentas).
   *
   * O passo 1 vale sempre, mesmo sem o passo 2 (processo reiniciado, outra
   * instância): destravar o usuário não pode depender de onde o turno está.
   */
  app.post<{ Params: { conversationId: string } }>(
    '/agent/chat/:conversationId/stop',
    async (request, reply) => {
      const userId = await request.getCurrentUserId();
      const conv = await prisma.conversation.findFirst({
        where: { id: request.params.conversationId, userId },
      });
      if (!conv) return reply.code(404).send({ message: 'Conversation not found' });

      const aborted = abortRun(conv.id);
      // `done` (e não `error`): parar é uma decisão do usuário, não uma falha.
      await finishRun(conv.id, 'done');

      return reply.send({ stopped: true, aborted });
    },
  );

  /** Descarta um turno travado (permite recomeçar sem esperar o TTL). */
  app.delete<{ Params: { conversationId: string } }>(
    '/agent/chat/:conversationId/run',
    async (request, reply) => {
      const userId = await request.getCurrentUserId();
      const conv = await prisma.conversation.findFirst({
        where: { id: request.params.conversationId, userId },
      });
      if (!conv) return reply.code(404).send({ message: 'Conversation not found' });
      await clearRun(conv.id);
      return reply.send({ cleared: true });
    },
  );
};
