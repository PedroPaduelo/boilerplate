/**
 * SSE Sink — implementa AgentSink escrevendo eventos SSE na resposta HTTP.
 * Cada método do sink emite um event: ... \ndata: {...}\n\n na conexão SSE.
 */

import type { FastifyReply } from 'fastify';
import type { AgentSink, StepEvent } from './types.js';

export function createSseSink(reply: FastifyReply): AgentSink {
  const send = (event: string, data: Record<string, unknown>) => {
    reply.raw.write(`event: ${event}\n`);
    reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  let currentMessageId: string | null = null;

  return {
    onUserMessage(text) {
      // SSE só envia eventos do agent; o user message já está no body do POST.
    },

    onLog(message, level = 'info') {
      send('log', { level, message });
    },

    onStep(step: StepEvent) {
      // Stream de texto do step atual
      if (step.text && step.text.length > 0) {
        if (!currentMessageId) {
          currentMessageId = `asg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          send('message_start', { messageId: currentMessageId });
        }
        send('text_delta', { messageId: currentMessageId, delta: step.text });
      }

      // Tool calls
      if (step.toolCalls) {
        for (const tc of step.toolCalls) {
          send('tool_step', {
            toolCallId: tc.toolCallId,
            toolName: tc.toolName,
            args: tc.args,
            phase: 'call',
          });
        }
      }

      // Tool results
      if (step.toolResults) {
        for (const tr of step.toolResults) {
          send('tool_step', {
            toolCallId: tr.toolCallId,
            toolName: tr.toolName,
            output: tr.output,
            phase: 'result',
          });
        }
      }

      // Usage
      if (step.usage) {
        send('usage', step.usage);
      }
    },

    onFinal(result) {
      if (currentMessageId) {
        send('message_end', { messageId: currentMessageId });
        currentMessageId = null;
      }
      send('final', {
        finishReason: result.finishReason,
        steps: result.steps,
        elapsedMs: result.elapsedMs,
        usage: result.usage,
      });
    },

    onError(error) {
      if (currentMessageId) {
        send('message_end', { messageId: currentMessageId });
        currentMessageId = null;
      }
      send('error', { message: error.message });
    },
  };
}
