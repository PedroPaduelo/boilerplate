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
import type {
  BlockDataResult,
  ChatArtifactEvent,
  ChatChartPayload as ChatChartPayloadWire,
  ChatPhaseEvent,
  ChatToolStepEvent,
  ChatUsageEvent,
  DataBinding,
} from '@dashboards/contracts';

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
export interface ChatChartPayload extends Omit<
  ChatChartPayloadWire,
  'result' | 'dataBinding'
> {
  /**
   * Resultado de dados JÁ no shape do contrato — alimenta o BlockRenderer inline.
   * O contrato do socket declara `unknown` (é JSON cru na rede); aqui estreitamos
   * para o que o render-engine consome, e o estreitamento acontece no transporte.
   */
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
  /**
   * Gráficos inline da resposta (só em mensagens do assistente), na ordem em
   * que o agente os produziu.
   *
   * É uma LISTA porque um turno rende quantos gráficos a pergunta pedir — "monte
   * um painel de mensagens" devolve KPIs, barras e donut de uma vez. Enquanto
   * isto era um campo único, cada gráfico novo sobrescrevia o anterior e a
   * resposta chegava à tela com um gráfico só; os demais viravam cartão "abrir
   * gráfico", empurrando o usuário para fora do chat para ver o que ele já
   * tinha pedido ali. O servidor sempre mandou todos (um evento `chart` cada,
   * e `toolData.charts` no banco) — era o front que os descartava.
   */
  charts?: ChatChartPayload[];
  /** ISO timestamp de criação. */
  createdAt: string;
}

/**
 * Cargas dos eventos de auditoria, REAPROVEITADAS do contrato.
 *
 * Só tiramos os campos de roteamento (`conversationId`/`runId`): quem escuta já
 * filtrou a conversa, e repassá-los para dentro da tela convidaria a UI a
 * decidir sobre roteamento. Redeclarar os campos aqui seria pior: cada campo
 * novo do contrato precisaria ser copiado à mão e um esquecimento vira campo
 * silenciosamente descartado — que é exatamente como a auditoria se perdeu.
 */
export type ChatToolStepPayload = Omit<ChatToolStepEvent, 'conversationId' | 'runId'>;
export type ChatPhasePayload = Omit<ChatPhaseEvent, 'conversationId' | 'runId'>;
export type ChatArtifactPayload = Omit<ChatArtifactEvent, 'conversationId' | 'runId'>;
/**
 * `messageId` fica opcional (o contrato o exige) porque o transporte SSE antigo
 * manda o consumo sem ele — só há um turno em voo, então a tela sabe a quem
 * pertence. Sem essa folga, um backend antigo derrubaria o tipo.
 */
export type ChatUsagePayload = Omit<
  ChatUsageEvent,
  'conversationId' | 'runId' | 'messageId'
> & { messageId?: string };

/**
 * Eventos de STREAMING emitidos pelo transporte enquanto o agente responde.
 *
 * Este é o protocolo (= o que a API real deverá expor, p.ex. via SSE/WebSocket):
 * - `message_start`  → abre uma mensagem do assistente (id estável).
 * - `text_delta`     → um pedaço de texto (o efeito de "digitando").
 * - `chart`          → anexa um gráfico inline à mensagem.
 * - `message_end`    → fecha a mensagem.
 * - `error`          → falha no meio do stream.
 * - `tool_step`      → um passo da trilha de auditoria (`call` e depois `result`).
 * - `phase`          → em que ponto do turno o agente está.
 * - `artifact`       → gráfico/dashboard que o agente criou ou alterou.
 * - `usage`          → consumo do turno (tokens, tempo, passos).
 * - `title`          → conversa renomeada pelo servidor.
 */
export type ChatEvent =
  | { type: 'message_start'; messageId: string }
  | { type: 'text_delta'; messageId: string; delta: string }
  | { type: 'chart'; messageId: string; chart: ChatChartPayload }
  | { type: 'message_end'; messageId: string }
  | { type: 'error'; message: string }
  /** `messageId` só existe quando o passo chega junto de uma mensagem já aberta. */
  | ({ type: 'tool_step'; messageId?: string } & ChatToolStepPayload)
  | ({ type: 'phase' } & ChatPhasePayload)
  | ({ type: 'artifact' } & ChatArtifactPayload)
  | ({ type: 'usage' } & ChatUsagePayload)
  | { type: 'title'; title: string };

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
