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
 * `actor` é resolvido via `getWhatsappSystemUserId` + role='ADMIN' (o agente
 * roda em nome do WhatsApp System user). Ele AGORA importa: as tools do MCP
 * (passadas via `buildMcpToolsForAgent(actor)`) o consomem para impor
 * RBAC/visibilidade. O WhatsApp deixou de ser MVP-sem-tools — tem as mesmas
 * tools + skills do chat web (com prompt adaptado ao WhatsApp).
 */

import fs from 'node:fs/promises';
import path from 'node:path';

import { runAgent } from '@/modules/agent/agent/loop';
import { addMessage, loadConversationHistory } from '@/modules/agent/services/conversation';
import { createAnthropicWithExtras } from '@/modules/agent/provider/anthropic';
import { DEFAULT_AGENT_CONFIG } from '@/modules/agent/config/schemas';
import { buildMcpToolsForAgent } from '@/modules/agent/tools/mcp-adapter';
import {
  createActivateSkillTool,
  loadAllSkills,
  renderSkillsIndex,
} from '@/modules/agent/skills/index';
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

/**
 * Converte markdown comum para a sintaxe nativa do WhatsApp.
 * - **bold** ou __bold__  -> *bold*  (WhatsApp usa 1 asterisco)
 * - headings (# / ## / ###) -> *texto* (negrito, sem o #)
 * - bullets "- " / "* " -> "• " (bullet nativo, mais bonito)
 * - tabelas markdown -> linhas simples "campo | valor" (best-effort)
 * - remove HTML tags residuais
 * - links [texto](url) -> "texto: url"
 * - colapsa 3+ quebras de linha em 2
 *
 * Determinístico: roda sobre o texto final do agente, garantindo que o
 * WhatsApp renderize negrito/itálico corretamente mesmo que o modelo
 * insista em markdown.
 */
export function mdToWhatsapp(text: string): string {
  let t = text;

  // 1. Headings (### Titulo / ## Titulo / # Titulo) -> *Titulo* em linha própria
  t = t.replace(/^#{1,6}\s+(.+?)\s*$/gm, '*$1*');

  // 2. Bold markdown **x** ou __x__ -> *x* (WhatsApp). Cuidado pra não pegar *já-single*.
  t = t.replace(/\*\*([^*\n]+?)\*\*/g, '*$1*');
  t = t.replace(/__([^_\n]+?)__/g, '*$1*');

  // 3. Bullets "- " ou "* " no inicio da linha -> "• "
  t = t.replace(/^[\t ]*[-*]\s+/gm, '\u2022 ');

  // 4. Tabela markdown: remove a linha separadora |---|---| (junto com seu
  //    newline, pra não deixar linha em branco) e troca pipes por " | " simples
  //    (best-effort — WhatsApp nao tem tabela; deixa legivel). Usamos [ \t]
  //    (não \s) pra os regexes NÃO cruzarem quebras de linha.
  t = t.replace(/^[ \t]*\|?[ \t:|-]*\|[ \t:|-]*$\n?/gm, ''); // linha separadora
  t = t.replace(/^[ \t]*\|(.+)\|[ \t]*$/gm, (_m, inner) =>
    inner.split('|').map((c: string) => c.trim()).filter(Boolean).join(' | '),
  );

  // 5. Remove tags HTML residuais (ex.: <details>, <br>)
  t = t.replace(/<\/?[a-zA-Z][^>]*>/g, '');

  // 6. Links markdown [texto](url) -> texto: url
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1: $2');

  // 7. Colapsa 3+ quebras de linha em 2
  t = t.replace(/\n{3,}/g, '\n\n');

  return t.trim();
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
  let basePrompt: string;
  try {
    basePrompt = await fs.readFile(WHATSAPP_PROMPT_PATH, 'utf-8');
  } catch (err) {
    logger.error({ err }, 'channels: failed to read whatsapp system prompt — using fallback');
    basePrompt = 'Voce e o assistente WhatsApp da plataforma. Responda de forma concisa.';
  }

  // Skills: mesmo mecanismo do chat web (chat.ts) — carrega o índice das skills
  // disponíveis e o ANEXA ao system prompt. O agente as ativa via a tool
  // `activate_skill` (adicionada às tools abaixo) quando o assunto pedir.
  const skills = await loadAllSkills();
  const skillsIndex = renderSkillsIndex(skills);
  const systemPrompt = skillsIndex ? `${basePrompt}\n${skillsIndex}` : basePrompt;

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

  // 3) Roda o agente COM as tools do MCP + skills (igual ao chat web), para ele
  // ser aderente ao prompt e capaz de listar dashboards/charts, gerar link
  // público, consultar dados etc. `actor` reflete a decisão #8: o agente roda
  // EM NOME do WhatsApp System user (role ADMIN). Agora o actor IMPORTA — as
  // tools MCP o consomem para impor RBAC/visibilidade. RESOLVEMOS o id
  // (fail-loud se não seedado) e LOGAMOS pra auditoria de "quem representou".
  const actor = {
    userId: await getWhatsappSystemUserId(),
    role: 'ADMIN' as const,
    departmentIds: [] as string[],
  };
  logger.debug(
    { channel: 'whatsapp', actorUserId: actor.userId, actorRole: actor.role, conversationId },
    'channels: running agent as whatsapp system actor',
  );

  // Tools: TODAS as tools do MCP (list_dashboards, list_charts, create_dashboard_
  // share_link, run_query, create_chart, ...) + a tool `activate_skill`.
  const mcpTools = buildMcpToolsForAgent(actor);
  const skillTool = { activate_skill: createActivateSkillTool(skills) };
  const allTools = { ...mcpTools, ...skillTool };

  let result: { text: string; usage?: { inputTokens?: number; outputTokens?: number } };
  try {
    result = await runAgent({
      model,
      tools: allTools as never,
      systemPrompt,
      convo: recent as never, // ModelMessage[] do AI SDK
      cacheBreakpoint: DEFAULT_AGENT_CONFIG.cacheBreakpoint,
      cacheOptions: DEFAULT_AGENT_CONFIG.cacheOptions,
      temperature: DEFAULT_AGENT_CONFIG.temperature,
      maxSteps: 15, // espaço para tool calls + activate_skill
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
  // PÓS-PROCESSADOR DE FORMATAÇÃO: o WhatsApp NÃO renderiza markdown
  // (`**negrito**`, `# heading`, tabelas). Convertemos pra sintaxe nativa
  // (`*negrito*`, `• bullet`, etc.) ANTES do guardrail e do truncate.
  const whatsappFormatted = mdToWhatsapp(rawText);
  // GUARDRAIL DE IDENTIDADE (determinístico, à prova de bypass): substitui a
  // resposta pela frase canônica se vazar termo proibido OU se a pergunta do
  // usuário for de identidade.
  const guardedText = enforceIdentity(whatsappFormatted, userText);
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
