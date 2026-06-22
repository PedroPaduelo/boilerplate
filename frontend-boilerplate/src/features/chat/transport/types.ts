/**
 * CONTRATO do chat embutido (T-H) — esta é a "costura" (seam) que isola a UI
 * da fonte das respostas do agente.
 *
 * ⚠️  IMPORTANTE PARA A T-H2 (integração real):
 * Os tipos deste arquivo + a interface {@link ChatTransport} SÃO o contrato que
 * a API externa do agente deverá seguir. Hoje existe apenas a implementação
 * MOCK ({@link file://./mock-transport.ts MockChatTransport}); a T-H2 só precisa
 * escrever um `HttpChatTransport` que implemente esta MESMA interface (consumindo
 * a spec da API externa — endpoints/auth/streaming) e trocá-lo no provider
 * ({@link file://./context.tsx}). A UI (lista de mensagens, input, render inline,
 * "adicionar ao dashboard") NÃO muda.
 *
 * Decisões travadas (docs/plano/06 e 22):
 * - O agente é EXTERNO; nosso FE só tem o chat embutido.
 * - O agente cria via nosso MCP e devolve um `chartId` + bloco renderável → o FE
 *   renderiza inline com o MESMO render-engine do dashboard (BlockRenderer).
 * - Sem persistência de histórico do nosso lado (o agente externo é stateless
 *   para nós): o histórico vive em memória na sessão do chat.
 */
import type { BlockDataResult, DataBinding } from '@dashboards/contracts';

/** Papel de uma mensagem no chat. */
export type ChatRole = 'user' | 'assistant';

/**
 * Payload de GRÁFICO que uma mensagem do assistente pode carregar.
 *
 * É o formato que a API real deverá devolver para renderizar um gráfico INLINE
 * no chat e permitir "adicionar a um dashboard":
 * - `result` é o dado JÁ no shape do contrato (scalar/series/categorical/table),
 *   exatamente o que o `BlockRenderer` consome.
 * - `catalogType` + `props` definem o bloco visual (kpi/bar_chart/line_chart/...).
 * - `dataBinding` (query/transform/ttl) é o que materializa um Chart real quando
 *   o usuário clica "adicionar ao dashboard" (POST /charts + POST /dashboards/:id/blocks).
 * - `chartId` é preenchido quando o agente JÁ criou o Chart via MCP (na API real).
 *   No mock fica ausente — o fluxo de "adicionar" cria o Chart na hora.
 */
export interface ChatChartPayload {
  /** Id do Chart criado via MCP pelo agente externo (quando real). Mock: ausente. */
  chartId?: string;
  /** Título sugerido pelo agente (vira o título do Chart ao adicionar ao dashboard). */
  title: string;
  /** catalogType do bloco (kpi | bar_chart | line_chart | donut | table | ...). */
  catalogType: string;
  /** Props visuais do bloco (mescladas com os defaults do manifesto). */
  props?: Record<string, unknown>;
  /** Resultado de dados JÁ no shape do contrato — alimenta o BlockRenderer inline. */
  result: BlockDataResult;
  /**
   * Vínculo de dados (conexão/query/transform/ttl) que materializa o Chart ao
   * adicionar ao dashboard. No mock o `connectionId` é um placeholder — o diálogo
   * de "adicionar" substitui pela conexão real escolhida pelo usuário.
   */
  dataBinding?: DataBinding;
}

/** Uma mensagem do chat (estado de UI; não há persistência no nosso backend). */
export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  /** Gráfico inline (só em mensagens do assistente). */
  chart?: ChatChartPayload;
  /** ISO timestamp de criação. */
  createdAt: string;
}

/**
 * Eventos de STREAMING emitidos pelo transporte enquanto o agente responde.
 *
 * Este é o protocolo (= o que a API real deverá expor, p.ex. via SSE/WebSocket):
 * - `message_start`  → abre uma mensagem do assistente (id estável).
 * - `text_delta`     → um pedaço de texto (o efeito de "digitando").
 * - `chart`          → anexa um gráfico inline à mensagem.
 * - `message_end`    → fecha a mensagem.
 * - `error`          → falha no meio do stream.
 */
export type ChatEvent =
  | { type: 'message_start'; messageId: string }
  | { type: 'text_delta'; messageId: string; delta: string }
  | { type: 'chart'; messageId: string; chart: ChatChartPayload }
  | { type: 'message_end'; messageId: string }
  | { type: 'error'; message: string };

export interface SendMessageOptions {
  /** Permite abortar o stream (botão "parar" / desmontagem). */
  signal?: AbortSignal;
}

/**
 * A camada de TRANSPORTE do chat — a interface trocável.
 *
 * `sendMessage` recebe o histórico (incluindo a mensagem do usuário recém-enviada)
 * e devolve um `AsyncIterable<ChatEvent>` representando a resposta do agente em
 * streaming. Qualquer implementação (mock OU API real) só precisa honrar esta
 * assinatura — a UI consome via `for await (const ev of transport.sendMessage(...))`.
 */
export interface ChatTransport {
  sendMessage(
    history: ChatMessage[],
    options?: SendMessageOptions,
  ): AsyncIterable<ChatEvent>;
}
