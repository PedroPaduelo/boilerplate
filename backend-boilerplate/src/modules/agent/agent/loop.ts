/**
 * Loop do agent — chama streamText do AI SDK com stepCountIs,
 * emitindo texto token-a-token e cada step via AgentSink.
 *
 * POR QUE `streamText` E NÃO `generateText`:
 * O provider fica atrás de um proxy compatível com a API da Anthropic. Esse
 * proxy devolve blocos `thinking` SEM o campo `signature`. O schema Zod do
 * @ai-sdk/anthropic para respostas NÃO-streaming exige `signature: z.string()`,
 * então toda resposta com raciocínio explodia em
 * `APICallError: Invalid JSON response` (com HTTP 200!) — o agente respondia,
 * o texto aparecia na tela e logo depois vinha um banner de erro.
 * O schema do caminho de STREAMING não exige `signature`, então além de dar
 * streaming de verdade (UX melhor), ele é imune a essa divergência do proxy.
 */

import { streamText, stepCountIs, type ModelMessage, type Tool } from 'ai';
import type { AgentSink } from '../sinks/types.js';
import type { CacheOptions } from '../config/schemas.js';
import { buildMessages } from './messages.js';

export interface RunAgentOptions {
  model: any;
  tools: Record<string, Tool>;
  systemPrompt: string;
  convo: ModelMessage[];
  cacheBreakpoint: boolean;
  cacheOptions: CacheOptions;
  temperature?: number | undefined;
  maxSteps?: number | undefined;
  /** Teto de tokens de saída por chamada. Sem isto o provider usa o default do
   *  modelo (64k no sonnet-4), que estoura o limite de proxies/providers. */
  maxOutputTokens?: number | undefined;
  providerOptions?: Record<string, any> | undefined;
  sink: AgentSink;
}

export interface RunAgentResult {
  finishReason: string;
  steps: number;
  /** Texto do ÚLTIMO step (semântica do AI SDK). Mantido por compatibilidade. */
  text: string;
  /**
   * TODO o texto que foi transmitido ao cliente, somando todos os steps.
   * É isto que o usuário viu na tela — use este campo para persistir a
   * resposta, senão narração intermediária do agente se perde no histórico.
   */
  fullText: string;
  responseMessages: ModelMessage[];
  elapsedMs: number;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    cachedInputTokens?: number;
    reasoningTokens?: number;
  };
}

export async function runAgent(opts: RunAgentOptions): Promise<RunAgentResult> {
  // Constrói messages com cache breakpoints (sem o system, que vai separado)
  const messages = buildMessages(
    '', // system vazio — passamos como parâmetro separado
    opts.convo,
    opts.cacheBreakpoint,
    opts.cacheOptions,
  ).slice(1); // remove o system message do início do array

  const startedAt = Date.now();
  let stepIdx = 0;
  let fullText = '';

  const result = streamText({
    model: opts.model,
    system: opts.systemPrompt,
    messages,
    tools: opts.tools,
    temperature: opts.temperature,
    maxOutputTokens: opts.maxOutputTokens,
    stopWhen: stepCountIs(opts.maxSteps ?? 30),
    providerOptions: opts.providerOptions,
    onStepFinish: (step) => {
      stepIdx++;
      opts.sink.onStep({
        index: stepIdx,
        finishReason: step.finishReason,
        text: step.text,
        toolCalls: step.toolCalls?.map((tc: any) => ({
          toolCallId: tc.toolCallId,
          toolName: tc.toolName,
          args: tc.input ?? tc.args ?? {},
        })),
        toolResults: step.toolResults?.map((tr: any) => ({
          toolCallId: tr.toolCallId,
          toolName: tr.toolName,
          output: tr.output ?? tr.result,
        })),
        usage: step.usage as any,
      });
    },
  });

  // `streamText` NÃO rejeita a promise: falhas chegam como parte `error` do
  // fullStream. Capturamos aqui e relançamos no fim, para que o chamador
  // continue tratando erro com try/catch — mas só DEPOIS de ter entregue
  // todo o texto que já havia sido gerado.
  let streamError: unknown = null;

  for await (const part of result.fullStream) {
    if (part.type === 'text-delta') {
      const delta = (part as { text?: string }).text ?? '';
      if (delta) {
        fullText += delta;
        opts.sink.onTextDelta?.(delta);
      }
    } else if (part.type === 'error') {
      streamError = (part as { error?: unknown }).error;
    }
  }

  if (streamError) {
    throw streamError instanceof Error ? streamError : new Error(String(streamError));
  }

  const elapsedMs = Date.now() - startedAt;

  const [finishReason, text, usage, steps, response] = await Promise.all([
    result.finishReason,
    result.text,
    result.usage,
    result.steps,
    result.response,
  ]);

  const responseMessages = (response?.messages || []) as ModelMessage[];

  // Fecha o ciclo do sink. Sem isto, o caminho de SUCESSO nunca emite
  // `message_end`/`final` no SSE — e o frontend, que usa `message_end` para
  // fechar a mensagem, fica preso no estado de "streaming" indefinidamente.
  opts.sink.onFinal({
    finishReason,
    steps: steps.length,
    elapsedMs,
    text,
    usage: usage as any,
  });

  return {
    finishReason,
    steps: steps.length,
    text,
    fullText,
    responseMessages,
    elapsedMs,
    usage: usage as any,
  };
}
