/**
 * Serviço de conversas — CRUD + persistência de mensagens no banco.
 */

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

/**
 * Carrega o histórico de mensagens de uma conversa no formato ModelMessage[] do AI SDK.
 */
export async function loadConversationHistory(conversationId: string) {
  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });

  return messages.map((m) => {
    if (m.role === 'user') {
      return { role: 'user' as const, content: m.content };
    }
    // assistant
    return { role: 'assistant' as const, content: m.content };
  });
}
