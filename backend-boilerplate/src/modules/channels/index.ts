import type { FastifyPluginAsync } from 'fastify';
import { webhookEvolutionRoute } from './routes/webhook-evolution';
import { startWhatsappPoller } from './poller';

/**
 * Módulo `channels` — TRILHA WhatsApp (Evolution API).
 *
 * Plugin auto-descoberto por `@fastify/autoload`
 * (ver `src/http/modules-loader.ts` e `src/modules/README.md`). Diferente
 * dos módulos de domínio autenticados (`charts`, `dashboards`, etc.), este
 * NÃO registra o plugin `auth` — as rotas do canal são PÚBLICAS por design
 * (a Evolution precisa chamar de fora do nosso domínio, sem JWT).
 *
 * Rotas:
 *   POST /webhooks/evolution   inbound WhatsApp da Evolution API
 *
 * O gate de segurança fica por conta do `CHANNELS_WEBHOOK_SECRET` (header
 * `x-channel-secret`, configurável via env) — se setado, a rota compara
 * o header com o secret antes de processar. Se a integração está sem
 * env, a rota responde 503 (fail-closed).
 */
const channelsModule: FastifyPluginAsync = async (app) => {
  // Sem `app.register(auth)` aqui — webhook público (igual `/public/:token`
  // do módulo `share`). Autenticação por secret opcional.
  await webhookEvolutionRoute(app);

  // Poller de FALLBACK: a Evolution v2.3.7 nem sempre entrega o webhook de
  // inbound (contatos @lid). O poller puxa as mensagens da API e processa.
  // Idempotente com o webhook (markSeen por messageId). No-op se a Evolution
  // não está configurada.
  startWhatsappPoller();
};

export default channelsModule;