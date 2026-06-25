/**
 * Handler do canal WhatsApp — pega uma mensagem inbound (já validada +
 * persistida pelo webhook), chama o agente, persiste a resposta e envia
 * de volta pela Evolution.
 *
 * PONTO-CHAVE: este handler roda FIRE-AND-FORGET a partir do webhook
 * (a rota faz `setImmediate(() => processWhatsappMessage(...))`).
 * NUNCA retornar a `Promise` ao cliente HTTP — a Evolution espera um
 * 2xx RÁPIDO, e o `runAgent` pode levar 5-20s (LLM API + tools).
 *
 * Assinatura de `runAgent` (validada em `src/modules/agent/agent/loop.ts`):
 *   { model, tools, systemPrompt, convo, cacheBreakpoint, cacheOptions,
 *     sink, temperature?, maxSteps?, providerOptions? }
 * O briefing sugeria `runAgent({ conversationId, userMessage, history,
 * actor, model, systemPrompt, tools, maxSteps, cacheBreakpoint })` —
 * a assinatura real é diferente. ADAPTEI: monto `convo` a partir do
 * `history` (que é `ModelMessage[]`), crio um `sink` no-op (não temos
 * SSE aqui — é processamento batch), e forneço `model` via factory
 * `createAnthropicWithExtras` + `env.AI_MODEL`.
 *
 * `actor` é passado indiretamente — `runAgent` puro não usa, mas
 * `getWhatsappSystemUserId` + role='ADMIN' reflete o que o user pediu
 * (tools={} no MVP, então o actor não afeta nada). Documentado aqui
 * pra auditoria.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

import { runAgent } from '@/modules/agent/agent/loop';
import { addMessage, loadConversationHistory } from '@/modules/agent/services/conversation';
import { createAnthropicWithExtras } from '@/modules/agent/provider/anthropic';
import { DEFAULT_AGENT_CONFIG } from '@/modules/agent/config/schemas';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { getWhatsappSystemUserId } from '@/lib/whatsapp-system';
import { evolutionClient } from './evolution-client';

const MAX_CHARS = 4000;
const HISTORY_LIMIT = 20;

/**
 * GUARDRAIL DE IDENTIDADE — à prova de bypass (determinístico, no código).
 *
 * O system prompt PEDE pro modelo nunca se revelar como Claude/Anthropic, mas
 * o proxy/modelo às vezes IGNORA essa instrução (verificado: mesmo passando o
 * system prompt cru, o modelo respondeu "sou o Claude, da Anthropic"). Como a
 * regra é ABSOLUTA e não pode ser contornada, aplicamos um filtro no
 * RESULTADO: se a resposta mencionar qualquer termo proibido (claude,
 * anthropic, e variações de "modelo de linguagem/IA da Anthropic"), trocamos
 * a resposta INTEIRA pela frase canônica. Determinístico = não tem como o
 * modelo furar.
 */
const FORBIDDEN_IDENTITY = /\b(claude|anthropic|openai|chatgpt|gpt-?\d|gemini|llama)\b/i;
export const CANONICAL_IDENTITY =
  'Sou o modelo da auditoria AI, estou aqui pra te ajudar com questões tributárias.';

/**
 * Detecta perguntas diretas de identidade ("quem é você", "qual seu nome",
 * "que modelo", "quem te criou", etc.) para forçar a resposta canônica
 * mesmo que o modelo tente desviar sem citar termo proibido.
 */
const IDENTITY_QUESTION =
  /\b(quem (é|e|és|voc[eê]|tu)|seu nome|qual.*(nome|modelo|ia|intelig[eê]ncia)|que modelo|quem.*(criou|fez|desenvolveu)|voc[eê].*(é|e).*(modelo|ia|rob[oô]|bot|claude|gpt)|what.*(model|are you)|who are you)\b/i;

/**
 * Aplica o guardrail de identidade ao texto da resposta. Retorna a frase
 * canônica se (a) a resposta contém termo proibido OU (b) a pergunta do
 * usuário é uma pergunta de identidade. Senão devolve o texto original.
 */
export function enforceIdentity(replyText: string, userText: string): string {
  if (FORBIDDEN_IDENTITY.test(replyText)) return CANONICAL_IDENTITY;
  if (IDENTITY_QUESTION.test(userText)) return CANONICAL_IDENTITY;
  return replyText;
}

const WHATSAPP_PROMPT_PATH = path.resolve(
  process.cwd(),
  'src/modules/channels/system-prompt-whatsapp.md',
);

export interface ProcessWhatsappMessageInput {
  conversationId: string;
  userId: string;
  phoneNumber: string;
  text: string;
  messageId: string;
  pushName: string | null;
}

/**
 * Trunca `text` em `max` chars com sufixo "(continua...)". Garante que
 * a mensagem QUEPA no limite da Evolution (limite prático de ~65k, mas
 * usamos 4000 pra UX WhatsApp — uma msg de 4000 chars já é gigante).
 */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)} (continua...)`;
}

/**
 * Sink no-op — o `runAgent` exige um `AgentSink` mas aqui não temos
 * SSE/WebSocket pra onde mandar eventos (é processamento batch).
 * Logamos as etapas a nível `debug` pra não poluir, e capturamos o
 * texto final no `onFinal`.
 */
function createBatchSink() {
  return {
    onLog: (msg: string, level: 'info' | 'warn' | 'error' = 'info') => {
      logger.debug({ channel: 'whatsapp', level, msg }, 'agent:log');
    },
    onStep: (step: { index: number; text: string; toolCalls?: unknown[] }) => {
      logger.debug({ channel: 'whatsapp', stepIndex: step.index, textLen: step.text.length, toolCalls: step.toolCalls?.length ?? 0 }, 'agent:step');
    },
    onFinal: (final: { finishReason: string; steps: number; elapsedMs: number; text: string }) => {
      logger.debug({ channel: 'whatsapp', ...final, textLen: final.text.length }, 'agent:final');
    },
    onError: (error: Error) => {
      logger.warn({ channel: 'whatsapp', err: error.message }, 'agent:error');
    },
  };
}

/**
 * Processa UMA mensagem inbound de WhatsApp. Assume que `addMessage`
 * (USER) JÁ foi chamado pela rota (T2). Devolve Promise<void> —
 * o caller é que decide se quer `await` ou fire-and-forget.
 */
export async function processWhatsappMessage(input: ProcessWhatsappMessageInput): Promise<void> {
  const { conversationId, phoneNumber, messageId, pushName, text: userText } = input;

  // 1) Carrega histórico + system prompt.
  const history = await loadConversationHistory(conversationId);
  const recent = history.slice(-HISTORY_LIMIT);

  // System prompt: o user pediu fixo curto, lendo do .md em runtime
  // (mesmo padrão do `chat.ts` que lê `system-prompt.md`). Cache in-memory
  // simples — o handler é fire-and-forget, não vale a pena re-ler a cada
  // msg. Em prod o `tsx watch` recarrega o processo se o .md mudar.
  let systemPrompt: string;
  try {
    systemPrompt = await fs.readFile(WHATSAPP_PROMPT_PATH, 'utf-8');
  } catch (err) {
    logger.error({ err }, 'channels: failed to read whatsapp system prompt — using fallback');
    systemPrompt = 'Voce e o assistente WhatsApp da plataforma. Responda de forma concisa.';
  }

  // 2) Model factory (mesmo padrão do `chat.ts`).
  if (!env.ANTHROPIC_API_KEY) {
    // Sem LLM configurado → não dá pra responder. Persistimos um aviso
    // na conversa pra debug e saímos (sendText não é chamado).
    logger.warn(
      { conversationId, messageId },
      'channels: ANTHROPIC_API_KEY not set — cannot process WhatsApp message',
    );
    await addMessage(conversationId, {
      role: 'assistant',
      content: '(agente nao configurado — ANTHROPIC_API_KEY ausente)',
    });
    return;
  }

  const baseURL = env.AI_BASE_URL || 'https://api.anthropic.com';
  const provider = createAnthropicWithExtras({
    apiKey: env.ANTHROPIC_API_KEY,
    baseURL,
    cacheTools: DEFAULT_AGENT_CONFIG.cacheBreakpoint,
    toolsTtl: DEFAULT_AGENT_CONFIG.cacheOptions.toolsTtl,
  });
  const model = provider(env.AI_MODEL);

  // 3) Roda o agente. `tools: {}` no MVP — sem MCP, sem skills.
  // `actor` reflete a decisão #8: o agente roda EM NOME do WhatsApp System
  // user (role ADMIN). O `runAgent` PURO não recebe `actor` na assinatura
  // (só tools MCP o consomem, e aqui tools={}), então o actor não muda o
  // comportamento — mas RESOLVEMOS o id (fail-loud se não seedado) e
  // LOGAMOS pra auditoria de "quem o agente representou".
  const actor = {
    userId: await getWhatsappSystemUserId(),
    role: 'ADMIN' as const,
    departmentIds: [] as string[],
  };
  logger.debug(
    { channel: 'whatsapp', actorUserId: actor.userId, actorRole: actor.role, conversationId },
    'channels: running agent as whatsapp system actor',
  );

  let result: { text: string; usage?: { inputTokens?: number; outputTokens?: number } };
  try {
    result = await runAgent({
      model,
      tools: {},
      systemPrompt,
      convo: recent as never, // ModelMessage[] do AI SDK
      cacheBreakpoint: DEFAULT_AGENT_CONFIG.cacheBreakpoint,
      cacheOptions: DEFAULT_AGENT_CONFIG.cacheOptions,
      temperature: DEFAULT_AGENT_CONFIG.temperature,
      maxSteps: 5, // baixo — WhatsApp não tem tools, sem loop infinito
      providerOptions: undefined,
      sink: createBatchSink() as never,
    });
  } catch (err) {
    // Erro no LLM (timeout, quota, etc). Persistimos o erro como
    // mensagem do agente pra debug e NÃO chamamos sendText.
    logger.error({ err, conversationId, messageId }, 'channels: runAgent failed');
    await addMessage(conversationId, {
      role: 'assistant',
      content: `(erro: ${(err as Error).message})`,
    });
    return;
  }

  const rawText = (result.text ?? '').trim() || '(sem resposta)';
  // GUARDRAIL DE IDENTIDADE (determinístico, à prova de bypass): substitui a
  // resposta pela frase canônica se vazar termo proibido OU se a pergunta do
  // usuário for de identidade.
  const guardedText = enforceIdentity(rawText, userText);
  const finalText = truncate(guardedText, MAX_CHARS);

  // 4) Persiste resposta do assistente.
  const assistantMsg = await addMessage(conversationId, {
    role: 'assistant',
    content: finalText,
    tokensIn: result.usage?.inputTokens,
    tokensOut: result.usage?.outputTokens,
  });

  // 5) Atualiza metadata da conversa com rastro do último reply.
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      metadata: {
        source: 'whatsapp',
        phoneNumber,
        lastInboundMessageId: messageId,
        lastAssistantMessageId: assistantMsg.id,
        lastReplyAt: new Date().toISOString(),
        pushName: pushName ?? null,
      },
    },
  });

  // 6) Envia de volta via Evolution. Falha aqui NÃO propaga — a
  // mensagem já está persistida (operador pode reenviar).
  try {
    const sent = await evolutionClient.sendText({ number: phoneNumber, text: finalText });
    if (sent.key === null) {
      logger.warn(
        { conversationId, messageId: assistantMsg.id },
        'channels: sendText returned null key (Evolution down?) — message saved in DB',
      );
    }
  } catch (err) {
    // `evolutionClient.sendText` JÁ captura e loga; este catch é só
    // safety net (a função promete não lançar, mas se mudar no futuro).
    logger.error(
      { err, conversationId, messageId: assistantMsg.id },
      'channels: sendText threw unexpectedly — message saved in DB, can be resent',
    );
  }
}
