/**
 * Serviço de conversas — CRUD + persistência de mensagens no banco.
 */

import { prisma } from '@/lib/prisma';

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

export async function listConversations(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: { userId },
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
