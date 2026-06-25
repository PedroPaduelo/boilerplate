/**
 * Normalizador do payload MESSAGES_UPSERT da Evolution API v2.
 *
 * Documentação: https://docs.evolutionfoundation.com.br/evolution-api/
 *
 * Eventos que IGNORAMOS (devolve `null`):
 *   - `fromMe === true`             → mensagens PRÓPRAS (eco da própria
 *                                      Evolution, fora do escopo).
 *   - `messageType` ≠ 'conversation'
 *     | 'extendedTextMessage'       → áudio, imagem, vídeo, doc, sticker etc.
 *   - texto vazio após trim         → msgs com mídia sem caption, por ex.
 *   - payload não conforme          → zod falha (lançado erro, NÃO retorna
 *                                      null — quem chama deve distinguir
 *                                      "ignorado" de "payload inválido".
 *
 * Schema:
 *   { event:'MESSAGES_UPSERT', instance:string,
 *     data:{ key:{ remoteJid, fromMe, id }, pushName?, message:UNSPEC,
 *            messageType? } }
 *
 * `data.message` é `z.unknown()` (com `.passthrough()` equivalente) — a forma
 * do campo depende de `messageType`. Extraímos o texto em runtime, não em
 * schema, porque a Evolution às vezes adiciona campos.
 */

import { z } from 'zod';
import type { InboundTextMessage } from './types';

/**
 * Schema estrito da envelope MESSAGES_UPSERT. `data.message` é
 * `z.unknown()` porque o conteúdo varia por tipo (conversation é string,
 * extendedTextMessage é objeto com campo `text`, imageMessage tem
 * caption, etc.). A extração do texto fica em `extractTextMessage`.
 */
export const evolutionUpsertSchema = z.object({
  event: z.literal('MESSAGES_UPSERT'),
  instance: z.string(),
  data: z.object({
    key: z.object({
      remoteJid: z.string(),
      fromMe: z.boolean(),
      id: z.string(),
      // WhatsApp "LID" (Linked ID — privacidade): quando o contato usa LID,
      // `remoteJid` vem como "<lid>@lid" e o número REAL fica em
      // `remoteJidAlt` ("<phone>@s.whatsapp.net"). Precisamos do número real
      // para ENVIAR a resposta de volta (a Evolution aceita o número real no
      // sendText). `addressingMode` === 'lid' sinaliza esse caso.
      remoteJidAlt: z.string().optional(),
      addressingMode: z.string().optional(),
    }),
    pushName: z.string().optional(),
    // unknown() aceita QUALQUER coisa (incluindo extras da Evolution) sem
    // rejeitar — equivalente a `.passthrough()` mas evita `cumulative` issues.
    message: z.unknown(),
    messageType: z.string().optional(),
  }),
});

/** Tipo inferido do schema, para uso interno em testes / debug. */
export type EvolutionUpsertPayload = z.infer<typeof evolutionUpsertSchema>;

/**
 * Extrai texto utilizável de uma mensagem MESSAGES_UPSERT.
 *
 * Retorna `null` se:
 *   - o payload não bate com o schema (mensagem vazia, evento diferente,
 *     etc.);
 *   - `data.key.fromMe === true` (eco da própria conta — não respondemos);
 *   - o tipo não é texto (`'conversation'` ou `'extendedTextMessage'`);
 *   - o texto extraído é vazio após `trim()`.
 *
 * NÃO LANÇA exceção — quem chama (a rota) recebe `null` e responde 200
 * com `{ ignored: 'reason' }` (a Evolution só considera 2xx como entregue;
 * qualquer não-2xx causa retry agressivo).
 */
export function extractTextMessage(payload: unknown): InboundTextMessage | null {
  const parsed = evolutionUpsertSchema.safeParse(payload);
  if (!parsed.success) return null;
  const { data } = parsed.data;

  // ignora mensagens PRÓPRIAS (eco da Evolution)
  if (data.key.fromMe) return null;

  const msg = (data.message ?? {}) as Record<string, unknown>;
  const messageType = data.messageType;

  let rawText: unknown;
  if (messageType === 'conversation') {
    rawText = msg.conversation;
  } else if (messageType === 'extendedTextMessage') {
    const ext = msg.extendedTextMessage as { text?: unknown } | undefined;
    rawText = ext?.text;
  } else {
    // tipo desconhecido / mídia → ignora
    return null;
  }

  if (typeof rawText !== 'string') return null;
  const text = rawText.trim();
  if (text.length === 0) return null;

  // Número para REPLY: o WhatsApp novo usa LID (privacidade) — nesse caso o
  // `remoteJid` é "<lid>@lid" (um id opaco) e o telefone REAL fica em
  // `remoteJidAlt` ("<phone>@s.whatsapp.net"). Para a resposta CHEGAR no
  // usuário, o sendText precisa do número real. Preferimos `remoteJidAlt`
  // quando ele aponta para um JID de telefone (@s.whatsapp.net); senão caímos
  // no `remoteJid` (caso clássico, sem LID).
  const altJid = data.key.remoteJidAlt;
  const jidForNumber =
    altJid && altJid.includes('@s.whatsapp.net') ? altJid : data.key.remoteJid;
  const phoneNumber = jidForNumber.split('@')[0].replace(/\D/g, '');
  if (phoneNumber.length === 0) return null;

  return {
    messageId: data.key.id,
    phoneNumber,
    pushName: typeof data.pushName === 'string' ? data.pushName : null,
    text,
  };
}
