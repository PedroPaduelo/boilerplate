/**
 * Loop do agent — chama generateText do AI SDK com stepCountIs,
 * emitindo cada step via AgentSink. Adaptado de uploads/f28n2-loop.ts.
 */

import { generateText, stepCountIs, type ModelMessage, type Tool } from 'ai';
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
  providerOptions?: Record<string, any> | undefined;
  sink: AgentSink;
}

export interface RunAgentResult {
  finishReason: string;
  steps: number;
  text: string;
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
  const messages = buildMessages(
    opts.systemPrompt,
    opts.convo,
    opts.cacheBreakpoint,
    opts.cacheOptions,
  );

  const startedAt = Date.now();
  let stepIdx = 0;

  const result = await generateText({
    model: opts.model,
    messages,
    tools: opts.tools,
    temperature: opts.temperature,
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

  const elapsedMs = Date.now() - startedAt;
  const responseMessages = (result.response?.messages || []) as ModelMessage[];

  return {
    finishReason: result.finishReason,
    steps: result.steps.length,
    text: result.text,
    responseMessages,
    elapsedMs,
    usage: result.usage as any,
  };
}
