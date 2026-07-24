/**
 * Tipos do AgentSink — interface que recebe eventos do loop do agent.
 * Adaptado do motor original para SSE em vez de WebSocket broadcast.
 */

export interface StepEvent {
  index: number;
  finishReason: string;
  text: string;
  toolCalls?: Array<{
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
  }>;
  toolResults?: Array<{
    toolCallId: string;
    toolName: string;
    output: unknown;
  }>;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    cachedInputTokens?: number;
    reasoningTokens?: number;
  };
}

export interface AgentSink {
  onUserMessage?(text: string): void;
  onLog?(message: string, level?: 'info' | 'warn' | 'error'): void;
  /**
   * Texto do assistant conforme ele é gerado (token a token).
   *
   * Existe porque o loop usa `streamText`: o texto chega em centenas de
   * pedaços em vez de um bloco por step. Quem consome (a rota SSE) repassa
   * cada delta direto ao browser — é isto que dá o efeito de digitação.
   *
   * `StepEvent.text` continua trazendo o texto COMPLETO do step (útil para
   * log/telemetria), então quem implementa `onTextDelta` NÃO deve emitir
   * `step.text` também, sob pena de duplicar o texto na tela.
   */
  onTextDelta?(delta: string): void;
  onStep(step: StepEvent): void;
  onFinal(result: {
    finishReason: string;
    steps: number;
    elapsedMs: number;
    text: string;
    usage?: {
      inputTokens?: number;
      outputTokens?: number;
      cachedInputTokens?: number;
      reasoningTokens?: number;
    };
  }): void;
  onError(error: Error): void;
}
