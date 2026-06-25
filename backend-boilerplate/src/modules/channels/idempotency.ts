/**
 * Idempotência do webhook de WhatsApp.
 *
 * A Evolution API RETENTA webhooks em caso de não-2xx (e, na prática,
 * também em timeouts). Sem dedup, a mesma mensagem geraria:
 *   - 2+ `ChatMessage` (linhas duplicadas);
 *   - 2+ `runAgent` (custo de tokens dobrado);
 *   - 2+ `sendText` de volta (resposta duplicada no WhatsApp do usuário).
 *
 * Estratégia: `SETNX` semântico via `hasKey` + `setValue` no Redis com
 * TTL de 24h. O TTL é maior que o retry window típico da Evolution
 * (~30min para backoff agressivo) e menor que o horizonte de conversa
 * (a Evolution não retenta depois de horas).
 *
 * FAIL-OPEN em dev: se o Redis está degradado (ex.: modo degradado
 * quando o serviço cai), devolvemos `true` (processa). A consequência
 * é duplicação POTENCIAL em vez de DROPS SILENCIOSOS. Em produção
 * troque para `false` (drop) e exponha métrica — manter fail-open
 * aqui é decisão de MVP (mesma postura dos outros módulos que usam
 * Redis no projeto).
 */

import { redisService } from '@/lib/redis';
import { logger } from '@/lib/logger';

const TTL_SECONDS = 86_400; // 24h
const KEY = (id: string): string => `channels:wa:seen:${id}`;

/**
 * Marca a mensagem como vista. Retorna:
 *   - `true`  → primeira vez, pode processar;
 *   - `false` → já vista, PULE (é dup da Evolution).
 */
export async function markSeen(messageId: string): Promise<boolean> {
  try {
    const k = KEY(messageId);
    const alreadySeen = await redisService.hasKey(k);
    if (alreadySeen) return false;
    await redisService.setValue(k, '1', TTL_SECONDS);
    return true;
  } catch (err) {
    logger.warn({ err, messageId }, 'channels: idempotency degraded (fail-open)');
    return true;
  }
}
