/**
 * `whatsapp-system.ts` — identidade "dona" das conversas inbound de WhatsApp.
 *
 * O user seed tem `role: ADMIN, isActive: false` — a combinação dá:
 *   - ADMIN porque o `runAgent` (e muitas checagens de service) exigem
 *     papel com `artifacts:view` (e mais) pra não cair em 401/403.
 *   - `isActive: false` pra que o user NUNCA consiga logar (a `auth`
 *     middleware do FE rejeita login de inativos, mesmo com senha válida).
 *     Senha do seed é um hash bcrypt de string aleatória que NINGUÉM
 *     conhece — `isActive: false` é só uma camada extra de segurança.
 *
 * Fluxo (webhook):
 *   1. Evolution entrega MESSAGES_UPSERT em /webhooks/evolution.
 *   2. `getOrCreateWhatsappConversation` (T2) usa este id como
 *      `userId` da `Conversation` — toda msg do canal fica "dona" do
 *      WhatsApp System (não de um user humano).
 *   3. O `processWhatsappMessage` (T3) usa este id + role='ADMIN' como
 *      `actor` do `runAgent` — assim o agente roda com permissões
 *      plenas sem nunca identificar um humano.
 *
 * Por que NÃO criar `ChannelLink`/tabela nova: o briefing definiu metadata
 * Json? em `Conversation` como local do `source: 'whatsapp'` e
 * `phoneNumber`. Mantém o MVP enxuto.
 */
import { prisma } from '@/lib/prisma';

export const WHATSAPP_SYSTEM_USER_EMAIL = 'whatsapp-system@platform.internal';

/**
 * Resolve o id do user seed (cache-free — 1 query por chamada, simples).
 * Lança erro se o user não foi seedado — fail-loud em vez de cair num
 * fallback silencioso que corromperia a Conversation.
 */
export async function getWhatsappSystemUserId(): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { email: WHATSAPP_SYSTEM_USER_EMAIL },
    select: { id: true },
  });
  if (!user) {
    throw new Error(
      `WHATSAPP_SYSTEM_USER not seeded — run \`npm run db:seed\` (looking for ${WHATSAPP_SYSTEM_USER_EMAIL})`
    );
  }
  return user.id;
}
