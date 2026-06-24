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
