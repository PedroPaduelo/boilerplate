/**
 * Tipos do módulo `channels` — discriminated union de canais externos
 * (hoje só WhatsApp via Evolution API). Mantido em arquivo próprio pra evitar
 * que o resto do módulo precise importar axios/zod.
 *
 * IMPORTANTE: este módulo é o PONTO DE EXTENSÃO para outros canais
 * (Telegram, SMS, etc.) no futuro. Cada canal vira um `case` em
 * `processInbound(channel, ...)` e a rota do webhook correspondente.
 */

/** Identifica o canal externo de origem. Hoje só 'whatsapp'. */
export type Channel = 'whatsapp';

/** Mensagem de texto normalizada extraída do payload do provedor. */
export interface InboundTextMessage {
  /** Id único da mensagem no provedor (usado p/ idempotência no Redis). */
  messageId: string;
  /** Telefone do remetente (somente dígitos, ex.: "5562999999999"). */
  phoneNumber: string;
  /** Nome de exibição (pushName) — pode ser null em mensagens sem perfil. */
  pushName: string | null;
  /** Texto já normalizado (trim aplicado). */
  text: string;
}

/** Resultado de envio: o provedor devolve o id da mensagem enviada (ou null em erro). */
export interface SendTextResult {
  key: { id: string } | null;
}
