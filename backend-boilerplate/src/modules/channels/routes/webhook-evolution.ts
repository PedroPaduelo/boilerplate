/**
 * POST /webhooks/evolution — webhook inbound da Evolution API v2.
 *
 * DECISÕES (resumo, detalhes no `payload.ts` e `handler.ts`):
 *   - SEM auth JWT. A Evolution chama de FORA do nosso domínio —
 *     mesma postura que `/public/:token` no módulo `share`. Se
 *     `CHANNELS_WEBHOOK_SECRET` estiver setado, comparamos o header
 *     `x-channel-secret` em tempo (não constante — secret é privado).
 *   - SEM `requirePermission`. A Evolution não tem user. Quem
 *     "assina" a chamada é o secret compartilhado OU a origem confiada
 *     (em prod, restringir IP da Evolution no reverse-proxy).
 *   - 503 se a integração está sem env (`isEvolutionEnabled === false`).
 *     Fail-closed: sem config, não inventamos rota.
 *   - 200 com `{ ok, ignored }` se a msg é duplicada, mídia, fromMe=true,
 *     etc. A Evolution considera 2xx como entregue (sem retry) — usar
 *     4xx aqui causa backoff agressivo sem motivo.
 *   - Handler é `setImmediate(() => processWhatsappMessage(...))` —
 *     fire-and-forget. Devolvemos 200 IMEDIATO com o `conversationId`
 *     e `messageId` da Message USER persistida. O LLM pode levar
 *     5-20s e isso NÃO pode segurar a Evolution.
 *
 * A persistência da Message USER acontece AQUI (síncrono), ANTES do
 * fire-and-forget, pra que um crash no handler não perca a entrada
 * do histórico. A Message ASSISTANT é persistida pelo próprio handler.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { env, isEvolutionEnabled } from '@/lib/env';
import { logger } from '@/lib/logger';
import { addMessage } from '@/modules/agent/services/conversation';
import { extractTextMessage } from '../payload';
import { markSeen } from '../idempotency';
import { getOrCreateWhatsappConversation } from '../conversation-link';
import { processWhatsappMessage } from '../handler';

/**
 * Handler compartilhado pelas duas formas que a Evolution usa para entregar:
 *   - `POST /webhooks/evolution`                  (webhookByEvents=false)
 *   - `POST /webhooks/evolution/messages-upsert`  (webhookByEvents=true — a
 *     Evolution v2 sufixa o nome do evento no path). Aceitamos AMBOS pra não
 *     depender de como a instância está configurada.
 */
async function handleEvolutionWebhook(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  // Gate 1: env configurada?
  if (!isEvolutionEnabled()) {
    return reply.code(503).send({
      ok: false,
      code: 'channel_disabled',
      message: 'Evolution API env not configured',
    });
  }

  // Gate 2: secret compartilhado (opcional). Se setado, header obrigatório.
  if (env.CHANNELS_WEBHOOK_SECRET) {
    const got = request.headers['x-channel-secret'];
    if (got !== env.CHANNELS_WEBHOOK_SECRET) {
      return reply.code(401).send({ ok: false, code: 'invalid_secret' });
    }
  }

  // Parse + normalização. A Evolution às vezes envelopa o payload em
  // `{ data: {...} }` no formato por-evento; `extractTextMessage` já espera
  // `{ event, instance, data }`. Se vier sem `event`, tentamos reembrulhar.
  const body = request.body as Record<string, unknown> | undefined;
  let candidate: unknown = body;
  if (body && typeof body === 'object' && !('event' in body) && 'data' in body) {
    candidate = { event: 'MESSAGES_UPSERT', instance: body.instance ?? 'evolution', data: body.data };
  }
  const parsed = extractTextMessage(candidate);
  if (!parsed) {
    // Silencioso: mídia, fromMe, payload inválido → 200 ignored.
    return reply.code(200).send({ ok: true, ignored: 'not_text_or_fromMe' });
  }

  // Dedup via Redis (24h TTL). Idempotente com o POLLER (mesma chave por id).
  const isFirstTime = await markSeen(parsed.messageId);
  if (!isFirstTime) {
    return reply.code(200).send({ ok: true, dedup: true });
  }

  // Conversa ESTÁVEL por telefone (continuidade — wa-<phone>).
  const { id: conversationId, userId, isNew } =
    await getOrCreateWhatsappConversation(parsed.phoneNumber);

  // Persiste Message USER (síncrono — entrada do histórico).
  const userMsg = await addMessage(conversationId, {
    role: 'user',
    content: parsed.text,
  });

  // Dispara handler async — fire-and-forget.
  setImmediate(() => {
    processWhatsappMessage({
      conversationId,
      userId,
      phoneNumber: parsed.phoneNumber,
      text: parsed.text,
      messageId: parsed.messageId,
      pushName: parsed.pushName,
    }).catch((err) => {
      logger.error(
        { err, conversationId, messageId: userMsg.id },
        'channels: processWhatsappMessage failed (async)',
      );
    });
  });

  return reply.code(200).send({
    ok: true,
    conversationId,
    messageId: userMsg.id,
    isNew,
  });
}

export async function webhookEvolutionRoute(app: FastifyInstance): Promise<void> {
  app.post('/webhooks/evolution', handleEvolutionWebhook);
  // Alias por-evento (webhookByEvents=true): a Evolution sufixa o nome do
  // evento. Aceitamos o de mensagens recebidas.
  app.post('/webhooks/evolution/messages-upsert', handleEvolutionWebhook);
}
