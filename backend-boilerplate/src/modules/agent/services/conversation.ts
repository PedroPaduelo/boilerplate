/**
 * Serviço de conversas — CRUD + persistência de mensagens no banco.
 */

import type { ModelMessage } from 'ai';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface CreateConversationInput {
  userId: string;
  title?: string;
}

export async function createConversation({ userId, title }: CreateConversationInput) {
  return prisma.conversation.create({
    data: {
      userId,
      title: title ?? 'Nova conversa',
    },
  });
}

export interface ListConversationsOptions {
  /** Filtra por origem da conversa. 'whatsapp' usa o JSON filter em metadata. */
  source?: 'whatsapp' | 'app';
  /** Se true (e isAdmin), NÃO filtra por userId — lista de TODOS os donos. */
  scopeAll?: boolean;
  /** Papel do solicitante é ADMIN? Gate pra `scopeAll`. */
  isAdmin?: boolean;
}

/**
 * Lista conversas com filtros opcionais de origem e escopo.
 *
 * Compatível com o uso atual `listConversations(userId)` — sem `opts`,
 * comporta-se como antes (conversas do próprio usuário, mais recentes
 * primeiro).
 *
 * Regras de escopo:
 *   - `scopeAll === true && isAdmin === true` → NÃO filtra por userId
 *     (lista de TODOS os donos). O gate de role é responsabilidade da
 *     ROTA (que devolve 403 se `scope=all` sem ADMIN) — aqui só aplicamos
 *     o `isAdmin` como salvaguarda defensiva (sem ADMIN, sempre filtra
 *     por userId mesmo com scopeAll).
 *   - caso contrário → filtra por `userId`.
 *
 * Regras de origem (`source`):
 *   - `'whatsapp'` → `metadata->>'source' = 'whatsapp'` (Prisma JSON
 *     path filter). Conversas do app web (metadata null) NÃO aparecem.
 *   - `'app'` → conversas SEM source whatsapp (metadata null OU source
 *     diferente). Aproximamos com `NOT metadata.source = 'whatsapp'`.
 *   - `undefined` → sem filtro de origem.
 */
export async function listConversations(
  userId: string,
  opts: ListConversationsOptions = {},
) {
  const { source, scopeAll, isAdmin } = opts;

  const where: Record<string, unknown> = {};

  // Escopo: só ADMIN com scopeAll vê de todos; senão filtra pelo dono.
  const allOwners = Boolean(scopeAll && isAdmin);
  if (!allOwners) {
    where.userId = userId;
  }

  // Origem.
  if (source === 'whatsapp') {
    where.metadata = { path: ['source'], equals: 'whatsapp' };
  } else if (source === 'app') {
    // app = NÃO whatsapp. Inclui metadata NULL (conversas web, que não têm
    // metadata). Cuidado com a lógica three-valued do SQL: `NOT (x = 'whatsapp')`
    // dá NULL (não TRUE) quando metadata é NULL, excluindo essas linhas — por
    // isso o OR explícito com `Prisma.DbNull`.
    where.OR = [
      { metadata: { equals: Prisma.DbNull } },
      { NOT: { metadata: { path: ['source'], equals: 'whatsapp' } } },
    ];
  }

  const conversations = await prisma.conversation.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1, // só a última mensagem pra preview
      },
    },
  });
  return conversations;
}

export async function getConversation(id: string, userId: string) {
  return prisma.conversation.findFirst({
    where: { id, userId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

export async function deleteConversation(id: string, userId: string) {
  const conv = await prisma.conversation.findFirst({ where: { id, userId } });
  if (!conv) return null;
  await prisma.conversation.delete({ where: { id } });
  return conv;
}

export async function addMessage(conversationId: string, params: {
  role: string;
  content: string;
  toolData?: unknown;
  tokensIn?: number;
  tokensOut?: number;
}) {
  const msg = await prisma.chatMessage.create({
    data: {
      conversationId,
      role: params.role,
      content: params.content,
      toolData: params.toolData as any,
      tokensIn: params.tokensIn,
      tokensOut: params.tokensOut,
    },
  });
  // Atualiza o updatedAt da conversa
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
  return msg;
}

/** Uma tool executada num turno, do jeito que fica salva em `toolData`. */
export interface PersistedToolStep {
  toolCallId: string;
  toolName: string;
  args?: unknown;
  output?: unknown;
}

/**
 * Teto de caracteres por resultado de tool ao RECARREGAR o histórico.
 *
 * Um `get_connection_schema` de banco grande passa de 100 KB. Reinjetar isso
 * inteiro a cada turno estoura o contexto e custa caro. Truncamos o resultado
 * mantendo o começo — que é onde estão os identificadores que importam
 * (connectionId, chartId, nomes de tabela) — e sinalizamos o corte para o
 * agente saber que pode reconsultar se precisar do resto.
 */
const MAX_TOOL_OUTPUT_CHARS = 4000;

function compactToolOutput(output: unknown): string {
  let texto: string;
  try {
    texto = typeof output === 'string' ? output : JSON.stringify(output);
  } catch {
    texto = String(output);
  }
  if (texto == null) return 'null';
  if (texto.length <= MAX_TOOL_OUTPUT_CHARS) return texto;
  return (
    texto.slice(0, MAX_TOOL_OUTPUT_CHARS) +
    `\n…[resultado truncado: ${texto.length} caracteres no total. ` +
    `Chame a tool de novo se precisar do restante.]`
  );
}

/**
 * Carrega o histórico de uma conversa no formato ModelMessage[] do AI SDK,
 * INCLUINDO as tool calls e seus resultados.
 *
 * Por que as tools precisam entrar: sem elas o agente só herda o texto que
 * escreveu, e perde o que DESCOBRIU — qual connectionId está usando, o schema
 * que já leu, o chartId que acabou de criar. Na prática ele refazia a
 * descoberta a cada mensagem (gastando passos, tokens e tempo) ou, pior,
 * chutava um id de memória e falhava com "a conexão não está respondendo".
 *
 * O par assistant(tool-call) -> tool(tool-result) precisa vir COMPLETO e na
 * ordem: uma tool-call sem o resultado correspondente é rejeitada pela API.
 */
export async function loadConversationHistory(
  conversationId: string,
): Promise<ModelMessage[]> {
  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });

  const history: ModelMessage[] = [];

  for (const m of messages) {
    if (m.role === 'user') {
      history.push({ role: 'user', content: m.content });
      continue;
    }

    // `toolData` tem DUAS formas em produção, e as duas precisam funcionar:
    //   - array cru de passos — como a rota SSE legada (`routes/chat.ts`) grava;
    //   - `{ steps, artifacts, usage }` — a trilha de auditoria, que é o que a
    //     tela lê para reconstruir o que o agente fez.
    // Aceitar só a primeira faria o histórico voltar SEM as tool-calls: o agente
    // perderia o que descobriu no turno anterior (a conexão em uso, o schema já
    // lido, o gráfico recém-criado) e refaria a descoberta a cada pergunta.
    const brutos = Array.isArray(m.toolData)
      ? m.toolData
      : (m.toolData as { steps?: unknown } | null)?.steps;
    const steps = Array.isArray(brutos) ? (brutos as unknown as PersistedToolStep[]) : [];
    // Só reinjetamos passos completos: uma tool-call órfã quebra a requisição.
    const completos = steps.filter((s) => s && s.toolCallId && s.toolName);

    if (completos.length === 0) {
      if (m.content) history.push({ role: 'assistant', content: m.content });
      continue;
    }

    history.push({
      role: 'assistant',
      content: [
        ...(m.content ? [{ type: 'text' as const, text: m.content }] : []),
        ...completos.map((s) => ({
          type: 'tool-call' as const,
          toolCallId: s.toolCallId,
          toolName: s.toolName,
          input: s.args ?? {},
        })),
      ],
    });

    history.push({
      role: 'tool',
      content: completos.map((s) => ({
        type: 'tool-result' as const,
        toolCallId: s.toolCallId,
        toolName: s.toolName,
        output: { type: 'text' as const, value: compactToolOutput(s.output) },
      })),
    });
  }

  return history;
}
