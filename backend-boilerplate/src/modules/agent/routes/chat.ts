/**
 * POST /agent/chat/:conversationId — streaming SSE da resposta do agente.
 *
 * Body: { message: string }
 * Response: text/event-stream com eventos SSE.
 *
 * O agent usa as tools do MCP diretamente (no mesmo processo) e persiste
 * a conversa no banco (Conversation + ChatMessage).
 */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';
import type { ActorContext } from '@/lib/rbac';

import { createAnthropicWithExtras, extrasToProviderOptions } from '../provider/anthropic.js';
import { DEFAULT_AGENT_CONFIG } from '../config/schemas.js';
import { runAgent } from '../agent/loop.js';
import { buildMcpToolsForAgent } from '../tools/mcp-adapter.js';
import { loadAllSkills, renderSkillsIndex, createActivateSkillTool } from '../skills/index.js';
import { addMessage, loadConversationHistory } from '../services/conversation.js';

import { readFile } from 'node:fs/promises';
import path from 'node:path';

let _systemPrompt: string | null = null;

async function getSystemPrompt(): Promise<string> {
  if (_systemPrompt) return _systemPrompt;
  try {
    _systemPrompt = await readFile(path.join(__dirname, '..', 'config', 'system-prompt.md'), 'utf8');
  } catch {
    _systemPrompt = 'Voce e um agente de IA que ajuda a criar dashboards e analisar dados.';
  }
  return _systemPrompt;
}

export const chatRoute: FastifyPluginAsync = async (app) => {
  app.post<{
    Params: { conversationId: string };
    Body: { message: string };
  }>(
    '/agent/chat/:conversationId',
    {
      schema: {
        body: z.object({
          message: z.string().min(1).max(10000),
        }),
      },
    },
    async (request, reply) => {
      const userId = await request.getCurrentUserId();

      const conv = await prisma.conversation.findFirst({
        where: { id: request.params.conversationId, userId },
      });
      if (!conv) return reply.code(404).send({ error: 'Conversation not found' });

      if (!env.ANTHROPIC_API_KEY) {
        return reply.code(503).send({
          error: 'agent_not_configured',
          message: 'ANTHROPIC_API_KEY is not set.',
        });
      }

      const userMessage = request.body.message;

      // Resolve ActorContext
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });
      if (!user) return reply.code(401).send({ error: 'User not found' });

      const memberships = await prisma.departmentMembership.findMany({
        where: { userId },
        select: { departmentId: true },
      });

      const actor: ActorContext = {
        userId: user.id,
        role: user.role,
        departmentIds: memberships.map((m) => m.departmentId),
      };

      // Persiste mensagem do usuário
      await addMessage(conv.id, { role: 'user', content: userMessage });

      // Inicia SSE — seta headers via reply.header() antes de usar hijack().
      // O Fastify processa esses headers (incluindo CORS do plugin) quando
      // chamamos reply.hijack(), que congela os headers e transfere o controle
      // do socket para nós.
      reply.header('Content-Type', 'text/event-stream');
      reply.header('Cache-Control', 'no-cache');
      reply.header('Connection', 'keep-alive');
      reply.header('X-Accel-Buffering', 'no');
      reply.hijack();

      // Como hijack() congela mas NÃO escreve os headers, precisamos forçar
      // os headers CORS manualmente (o hook onSend não roda após hijack).
      const origin = request.headers.origin;
      if (origin) {
        reply.raw.setHeader('Access-Control-Allow-Origin', origin);
        reply.raw.setHeader('Access-Control-Allow-Credentials', 'true');
        reply.raw.setHeader('Vary', 'Origin');
      }

      // Agora escreve os headers HTTP + body direto no socket
      reply.raw.writeHead(200, reply.getHeaders() as Record<string, string | string[]>);

      const send = (event: string, data: Record<string, unknown>) => {
        reply.raw.write(`event: ${event}\n`);
        reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      let currentMessageId: string | null = null;
      const ensureMessageStart = () => {
        if (!currentMessageId) {
          currentMessageId = `asg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          send('message_start', { messageId: currentMessageId });
        }
      };

      try {
        const history = await loadConversationHistory(conv.id);

        const basePrompt = await getSystemPrompt();
        const skills = await loadAllSkills();
        const skillsIndex = renderSkillsIndex(skills);
        const systemPrompt = skillsIndex ? `${basePrompt}\n${skillsIndex}` : basePrompt;

        const baseURL = env.AI_BASE_URL || 'https://api.anthropic.com';
        const provider = createAnthropicWithExtras({
          apiKey: env.ANTHROPIC_API_KEY,
          baseURL,
          cacheTools: DEFAULT_AGENT_CONFIG.cacheBreakpoint,
          toolsTtl: DEFAULT_AGENT_CONFIG.cacheOptions.toolsTtl,
        });
        const model = provider(env.AI_MODEL);

        const mcpTools = buildMcpToolsForAgent(actor);
        const skillTool = { activate_skill: createActivateSkillTool(skills) };
        const allTools = { ...mcpTools, ...skillTool };

        const result = await runAgent({
          model,
          tools: allTools as any,
          systemPrompt,
          convo: history as any,
          cacheBreakpoint: DEFAULT_AGENT_CONFIG.cacheBreakpoint,
          cacheOptions: DEFAULT_AGENT_CONFIG.cacheOptions,
          temperature: DEFAULT_AGENT_CONFIG.temperature,
          maxSteps: DEFAULT_AGENT_CONFIG.maxSteps,
          providerOptions: extrasToProviderOptions(DEFAULT_AGENT_CONFIG.anthropicExtras),
          sink: {
            onLog: (msg, level = 'info') => send('log', { level, message: msg }),
            onStep: (step) => {
              if (step.text && step.text.length > 0) {
                ensureMessageStart();
                send('text_delta', { messageId: currentMessageId, delta: step.text });
              }
              if (step.toolCalls) {
                for (const tc of step.toolCalls) {
                  send('tool_step', {
                    toolName: tc.toolName,
                    toolCallId: tc.toolCallId,
                    args: tc.args,
                    phase: 'call',
                  });
                }
              }
              if (step.toolResults) {
                // Correlação call↔result por ÍNDICE: o AI SDK entrega
                // `toolCalls` e `toolResults` no MESMO step na MESMA ordem
                // (anthropic-dev-sdk). O `tr.toolCallId` que vem do TypedToolResult
                // também bate, mas correlacionar pelo call de mesmo índice torna
                // o invariante EXPLÍCITO e robusto a mudanças do SDK que possam
                // quebrar o shape do result.
                step.toolResults.forEach((tr, idx) => {
                  const matchingCall = step.toolCalls?.[idx];
                  const toolCallId = matchingCall?.toolCallId ?? tr.toolCallId;
                  send('tool_step', {
                    toolName: tr.toolName,
                    toolCallId,
                    output: tr.output,
                    phase: 'result',
                  });
                  if (tr.toolName === 'create_chart' && tr.output && typeof tr.output === 'object') {
                    const out = tr.output as Record<string, unknown>;
                    if (out.chartId) {
                      ensureMessageStart();
                      send('chart', { messageId: currentMessageId, chart: out });
                    }
                  }
                });
              }
              if (step.usage) {
                send('usage', step.usage);
              }
            },
            onFinal: (final) => {
              if (currentMessageId) {
                send('message_end', { messageId: currentMessageId });
                currentMessageId = null;
              }
              send('final', {
                finishReason: final.finishReason,
                steps: final.steps,
                elapsedMs: final.elapsedMs,
              });
            },
            onError: (error) => {
              if (currentMessageId) {
                send('message_end', { messageId: currentMessageId });
                currentMessageId = null;
              }
              send('error', { message: error.message });
            },
          },
        });

        // Persiste resposta
        await addMessage(conv.id, {
          role: 'assistant',
          content: result.text || '(sem resposta)',
          tokensIn: result.usage?.inputTokens,
          tokensOut: result.usage?.outputTokens,
        });

        // Auto-título na primeira mensagem
        if (history.length <= 1 && conv.title === 'Nova conversa') {
          await prisma.conversation.update({
            where: { id: conv.id },
            data: { title: userMessage.slice(0, 60) },
          });
        }
      } catch (err: any) {
        if (currentMessageId) {
          send('message_end', { messageId: currentMessageId });
          currentMessageId = null;
        }
        send('error', { message: err.message ?? 'Agent execution failed' });
        await addMessage(conv.id, {
          role: 'assistant',
          content: `Erro: ${err.message ?? 'Agent execution failed'}`,
        });
      } finally {
        reply.raw.end();
      }
    },
  );
};
