/**
 * Poller de fallback para mensagens inbound do WhatsApp (Evolution API).
 *
 * POR QUE EXISTE: a Evolution API v2.3.7 nem sempre ENTREGA o webhook de
 * mensagens recebidas — especialmente de contatos `@lid` (o novo identificador
 * de privacidade do WhatsApp). A mensagem É recebida e ARMAZENADA pela
 * Evolution, mas o POST pro nosso `/webhooks/evolution` não acontece. Sem isto,
 * o agente nunca "vê" a mensagem do usuário.
 *
 * COMO FUNCIONA: a cada `POLL_INTERVAL_MS`, busca as últimas mensagens da
 * instância (`findRecentMessages`), filtra as INBOUND de texto RECENTES e
 * processa cada uma — exatamente como o webhook faria. A idempotência
 * (`markSeen` por messageId no Redis) garante que:
 *   - mensagens já processadas pelo webhook NÃO sejam reprocessadas;
 *   - mensagens antigas (histórico) não gerem respostas (filtro de tempo +
 *     markSeen).
 *
 * Reusa o MESMO pipeline do webhook: `extractTextMessage` (inclui o fix de
 * `@lid` → número real) + `markSeen` + `getOrCreateWhatsappConversation` +
 * `addMessage(user)` + `processWhatsappMessage`.
 *
 * Idempotente no nível do processo: `startWhatsappPoller` só inicia UMA vez
 * (guarda o handle). Em ambiente sem Evolution configurada, não faz nada.
 */

import { isEvolutionEnabled } from '@/lib/env';
import { logger } from '@/lib/logger';
import { addMessage } from '@/modules/agent/services/conversation';
import { evolutionClient } from './evolution-client';
import { extractTextMessage } from './payload';
import { markSeen } from './idempotency';
import { getOrCreateWhatsappConversation } from './conversation-link';
import { processWhatsappMessage } from './handler';

const POLL_INTERVAL_MS = 5_000;
// Só processa mensagens recebidas nos últimos N segundos (evita responder a
// histórico no 1º tick). markSeen cobre o resto.
const FRESH_WINDOW_MS = 3 * 60_000; // 3 min

let pollerHandle: NodeJS.Timeout | null = null;
let running = false; // evita ticks concorrentes se um tick demorar

/**
 * Um "tick" do poller: busca mensagens recentes e processa as inbound novas.
 */
async function pollOnce(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const records = await evolutionClient.findRecentMessages(20);
    if (records.length === 0) return;

    const now = Date.now();

    for (const rec of records) {
      // O record da Evolution tem quase o mesmo shape do `data` do webhook:
      // { key:{...}, pushName, messageType, message:{...}, messageTimestamp }.
      // Envelopamos para reusar `extractTextMessage` (inclui o fix @lid).
      const parsed = extractTextMessage({
        event: 'MESSAGES_UPSERT',
        instance: 'poller',
        data: rec,
      });
      if (!parsed) continue;

      // Filtro de tempo: messageTimestamp vem em SEGUNDOS (epoch) na Evolution.
      const tsSec = Number(
        (rec as { messageTimestamp?: unknown }).messageTimestamp ?? 0,
      );
      const tsMs = tsSec > 0 ? tsSec * 1000 : now;
      if (now - tsMs > FRESH_WINDOW_MS) continue; // mensagem antiga → ignora

      // Idempotência: se já foi vista (webhook ou tick anterior), pula.
      const isFirstTime = await markSeen(parsed.messageId);
      if (!isFirstTime) continue;

      try {
        const { id: conversationId, userId } =
          await getOrCreateWhatsappConversation(parsed.phoneNumber);
        await addMessage(conversationId, { role: 'user', content: parsed.text });
        logger.info(
          { conversationId, phoneNumber: parsed.phoneNumber, via: 'poller' },
          'channels: inbound message picked up by poller',
        );
        // fire-and-forget (não bloqueia o loop do poller)
        void processWhatsappMessage({
          conversationId,
          userId,
          phoneNumber: parsed.phoneNumber,
          text: parsed.text,
          messageId: parsed.messageId,
          pushName: parsed.pushName,
        }).catch((err) =>
          logger.error({ err, conversationId }, 'channels: poller processWhatsappMessage failed'),
        );
      } catch (err) {
        logger.error({ err, messageId: parsed.messageId }, 'channels: poller persist failed');
      }
    }
  } catch (err) {
    logger.warn({ err }, 'channels: poller tick failed');
  } finally {
    running = false;
  }
}

/**
 * Inicia o poller (idempotente). No-op se a Evolution não está configurada
 * ou se já está rodando.
 */
export function startWhatsappPoller(): void {
  if (pollerHandle) return; // já iniciado
  if (!isEvolutionEnabled()) {
    logger.info('channels: poller NÃO iniciado (Evolution não configurada)');
    return;
  }
  logger.info({ intervalMs: POLL_INTERVAL_MS }, 'channels: WhatsApp poller iniciado (fallback do webhook)');
  pollerHandle = setInterval(() => {
    void pollOnce();
  }, POLL_INTERVAL_MS);
  // não segura o event loop no shutdown
  if (typeof pollerHandle.unref === 'function') pollerHandle.unref();
}

/** Para o poller (usado em testes / shutdown). */
export function stopWhatsappPoller(): void {
  if (pollerHandle) {
    clearInterval(pollerHandle);
    pollerHandle = null;
  }
}
