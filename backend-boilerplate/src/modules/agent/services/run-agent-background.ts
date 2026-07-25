/**
 * Executa um turno do agente DESACOPLADO da requisição HTTP.
 *
 * A requisição só dispara o turno e responde na hora; o trabalho segue aqui e
 * os pedaços saem por socket, para a sala da conversa. Como o estado vive no
 * Redis (`run-store`), sair da tela não interrompe nada e voltar retoma de onde
 * parou — que era a queixa central do SSE: o texto só existia enquanto a
 * conexão estivesse aberta.
 */
import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';
import type { ActorContext } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import { socketManager } from '@/socket/manager/socket-manager';

import { createAnthropicWithExtras, extrasToProviderOptions } from '../provider/anthropic.js';
import { DEFAULT_AGENT_CONFIG } from '../config/schemas.js';
import { runAgent } from '../agent/loop.js';
import { buildMcpToolsForAgent } from '../tools/mcp-adapter.js';
import { loadAllSkills, renderSkillsIndex, createActivateSkillTool } from '../skills/index.js';
import { addMessage, loadConversationHistory, type PersistedToolStep } from './conversation.js';
import { startRun, patchRun, finishRun, type RunToolStep } from './run-store.js';

/** Sala de socket por conversa: quem está com o chat aberto entra nela. */
export function chatRoom(conversationId: string): string {
  return `chat:${conversationId}`;
}

export const CHAT_EVENTS = {
  DELTA: 'chat:delta',
  TOOL_STEP: 'chat:tool-step',
  CHART: 'chat:chart',
  DONE: 'chat:done',
  ERROR: 'chat:error',
} as const;

export interface StartTurnParams {
  conversationId: string;
  userId: string;
  actor: ActorContext;
  userMessage: string;
  systemPrompt: string;
  runId: string;
}

/**
 * Dispara o turno e retorna imediatamente. Nunca lança: o erro é reportado
 * pelo socket e persistido — quem chamou já respondeu ao cliente.
 */
export function startTurnInBackground(params: StartTurnParams): void {
  void executarTurno(params).catch((err) => {
    logger.error({ err, conversationId: params.conversationId }, 'agent: turno falhou fora do fluxo');
  });
}

async function executarTurno({
  conversationId,
  userId,
  actor,
  userMessage,
  systemPrompt,
  runId,
}: StartTurnParams): Promise<void> {
  const messageId = `asg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const sala = chatRoom(conversationId);
  await startRun(conversationId, runId, messageId);

  const emit = (evento: string, payload: Record<string, unknown>) => {
    try {
      socketManager.sendToRoom(sala, evento, { conversationId, runId, ...payload });
    } catch {
      // Ninguém escutando (usuário saiu): o estado continua no Redis.
    }
  };

  const toolSteps = new Map<string, PersistedToolStep>();
  let texto = '';
  let usage: { inputTokens?: number; outputTokens?: number } | undefined;
  let erro: string | null = null;
  let historyLen = 0;

  /**
   * O estado autoritativo do turno vive AQUI, em memória, porque só existe um
   * produtor: este turno. O Redis é a cópia para quem chega depois.
   *
   * Escrever no Redis a cada delta com leitura-modificação-escrita perde
   * atualizações — os deltas chegam às centenas por segundo e as escritas se
   * atropelam (medido: uma resposta inteira virou 5 caracteres e seq=1).
   * Então acumulamos localmente e despejamos o estado COMPLETO de tempos em
   * tempos, sem depender do que está gravado.
   */
  let seq = 0;
  const passos: RunToolStep[] = [];
  let flushPendente: NodeJS.Timeout | null = null;
  let flushEmVoo: Promise<unknown> = Promise.resolve();

  const flush = () => {
    // Encadeia as escritas: nunca duas ao mesmo tempo para a mesma chave.
    flushEmVoo = flushEmVoo.then(() =>
      patchRun(conversationId, (s) => {
        s.text = texto;
        s.seq = seq;
        s.toolSteps = passos;
      }).catch(() => {}),
    );
    return flushEmVoo;
  };

  /** Agenda um flush no máximo a cada 200ms (o socket já entregou o delta). */
  const agendarFlush = () => {
    if (flushPendente) return;
    flushPendente = setTimeout(() => {
      flushPendente = null;
      void flush();
    }, 200);
  };

  try {
    const history = await loadConversationHistory(conversationId);
    historyLen = history.length;

    const provider = createAnthropicWithExtras({
      apiKey: env.ANTHROPIC_API_KEY!,
      baseURL: env.AI_BASE_URL || 'https://api.anthropic.com',
      cacheTools: DEFAULT_AGENT_CONFIG.cacheBreakpoint,
      toolsTtl: DEFAULT_AGENT_CONFIG.cacheOptions.toolsTtl,
    });

    const skills = await loadAllSkills();
    const allTools = {
      ...buildMcpToolsForAgent(actor),
      activate_skill: createActivateSkillTool(skills),
    };

    const result = await runAgent({
      model: provider(env.AI_MODEL),
      tools: allTools as never,
      systemPrompt,
      convo: history as never,
      cacheBreakpoint: DEFAULT_AGENT_CONFIG.cacheBreakpoint,
      cacheOptions: DEFAULT_AGENT_CONFIG.cacheOptions,
      temperature: DEFAULT_AGENT_CONFIG.temperature,
      maxOutputTokens: env.AI_MAX_TOKENS,
      maxSteps: DEFAULT_AGENT_CONFIG.maxSteps,
      providerOptions: extrasToProviderOptions(DEFAULT_AGENT_CONFIG.anthropicExtras),
      sink: {
        onTextDelta: (delta) => {
          texto += delta;
          seq += 1;
          // Emite na hora (quem está com a tela aberta vê digitando) e grava
          // com folga: o número do pedaço é o que permite retomar sem buraco.
          emit(CHAT_EVENTS.DELTA, { messageId, delta, seq });
          agendarFlush();
        },
        onStep: (step) => {
          for (const tc of step.toolCalls ?? []) {
            toolSteps.set(tc.toolCallId, {
              toolCallId: tc.toolCallId,
              toolName: tc.toolName,
              args: tc.args,
            });
            const passo: RunToolStep = {
              toolCallId: tc.toolCallId,
              toolName: tc.toolName,
              phase: 'call',
              args: tc.args,
            };
            passos.push(passo);
            emit(CHAT_EVENTS.TOOL_STEP, passo as unknown as Record<string, unknown>);
            agendarFlush();
          }
          (step.toolResults ?? []).forEach((tr, idx) => {
            const callId = step.toolCalls?.[idx]?.toolCallId ?? tr.toolCallId;
            const registrado = toolSteps.get(callId);
            if (registrado) registrado.output = tr.output;
            const passo: RunToolStep = {
              toolCallId: callId,
              toolName: tr.toolName,
              phase: 'result',
              output: tr.output,
            };
            passos.push(passo);
            emit(CHAT_EVENTS.TOOL_STEP, passo as unknown as Record<string, unknown>);
            agendarFlush();
          });

          if (step.usage) usage = step.usage;
        },
        onFinal: () => {},
        onError: () => {},
      },
    });

    texto = result.fullText || texto;
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number; responseBody?: unknown };
    logger.error(
      { message: e?.message, statusCode: e?.statusCode, responseBody: e?.responseBody },
      'agent: erro do provider',
    );
    erro = e?.message ?? 'Agent execution failed';
  }

  // Despeja o estado final ANTES de marcar como concluído: quem chegar depois
  // precisa encontrar o texto inteiro, não o que sobrou do último flush.
  if (flushPendente) clearTimeout(flushPendente);
  await flush();

  // Persistência fora do try do agente: falha de banco é problema nosso, não
  // vira "a IA falhou" na tela.
  try {
    const limpo = texto.trim();
    await addMessage(conversationId, {
      role: 'assistant',
      content: limpo || (erro ? `Erro: ${erro}` : '(sem resposta)'),
      toolData: [...toolSteps.values()].filter((s) => s.output !== undefined),
      tokensIn: usage?.inputTokens,
      tokensOut: usage?.outputTokens,
    });

    if (historyLen <= 1) {
      const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
      if (conv?.title === 'Nova conversa') {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { title: userMessage.slice(0, 60) },
        });
      }
    }
  } catch (persistErr) {
    logger.error({ err: persistErr, conversationId }, 'agent: falha ao persistir resposta');
  }

  await finishRun(conversationId, erro ? 'error' : 'done', erro ?? undefined);

  if (erro) {
    emit(CHAT_EVENTS.ERROR, { messageId, message: erro });
  } else {
    emit(CHAT_EVENTS.DONE, { messageId, text: texto });
  }
  // Avisa também fora da sala: pode haver outra aba do usuário só na listagem.
  socketManager.sendToUser(userId, 'chat:turn-complete', {
    conversationId,
    failed: erro !== null,
  });
}
