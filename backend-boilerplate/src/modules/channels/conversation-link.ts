/**
 * Vínculo WhatsApp ↔ Conversation.
 *
 * Decisão: a `id` da `Conversation` é `${epochMs}-${phoneNumber}` (string
 * determinística). Razões:
 *   1. Lookup trivial — `findUnique({ where: { id }})` resolve sem
 *      precisar de índice composto nem filtro por metadata.
 *   2. Idempotência implícita — se a Evolution reentregar (mesmo com
 *      `markSeen` falhando), o `findUnique` encontra a conversa existente
 *      e não duplica.
 *   3. Ordenação natural — conversations mais recentes têm ids maiores
 *      (epochMs crescente) e o `ORDER BY id DESC` na listagem do app
 *      traz as mais novas primeiro sem precisar de `updatedAt`.
 *
 * ATENÇÃO ao model `Conversation`: o schema declara `id String @id`
 * (sem `@default(cuid())` no model — o default vem da migration). Vamos
 * usar `prisma.conversation.create({ data: { id: ..., ... }})` que é
 * aceito quando o campo é apenas `String @id` (sem default no schema,
 * o Postgres deixa o client setar). Verificado via inspect do schema
 * em `prisma/schema.prisma`.
 *
 * O `userId` SEMPRE é o do WhatsApp System user (não do humano que
 * mandou a msg) — a conversa pertence à plataforma, não ao indivíduo.
 *
 * `metadata` guarda o `source: 'whatsapp'` (pra queries por origem) +
 * `phoneNumber` + `createdAt` (auditoria). Listagem ADMIN com
 * `source=whatsapp` é o que T4 adiciona.
 */

import { prisma } from '@/lib/prisma';
import { getWhatsappSystemUserId } from '@/lib/whatsapp-system';

export interface GetOrCreateResult {
  id: string;
  userId: string;
  isNew: boolean;
}

export async function getOrCreateWhatsappConversation(
  phoneNumber: string,
  now: Date = new Date(),
): Promise<GetOrCreateResult> {
  // ID ESTÁVEL por telefone: todas as mensagens do mesmo número caem na MESMA
  // conversa (continuidade — como um chat de verdade, com memória do
  // histórico). Antes usávamos `${epochMs}-${phone}`, que criava uma conversa
  // NOVA por mensagem (sem memória). O usuário pediu "como se eu estivesse no
  // chat", então continuidade é o comportamento correto.
  const conversationId = `wa-${phoneNumber}`;

  const userId = await getWhatsappSystemUserId();

  const existing = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, userId: true },
  });
  if (existing) {
    return { id: existing.id, userId: existing.userId, isNew: false };
  }

  // Título: WhatsApp · 5562999999999 · DD/MM HH:MM
  // Pedido do user: técnico e ordenável. `toLocaleString` com pt-BR + 24h.
  const stamp = now.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const title = `WhatsApp · ${phoneNumber} · ${stamp}`;

  const conv = await prisma.conversation.create({
    data: {
      id: conversationId,
      userId,
      title,
      metadata: {
        source: 'whatsapp',
        phoneNumber,
        createdAt: now.toISOString(),
      },
    },
    select: { id: true, userId: true },
  });
  return { id: conv.id, userId: conv.userId, isNew: true };
}
