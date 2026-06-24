/**
 * Montagem de messages pro LLM com cache breakpoints (Anthropic ephemeral).
 * Adaptado do motor original (uploads/f28n5-messages.ts).
 */

import type { ModelMessage } from 'ai';
import type { CacheOptions, CacheTtl } from '../config/schemas.js';

function cacheControl(ttl: CacheTtl) {
  const cc: Record<string, string> =
    ttl === '1h' ? { type: 'ephemeral', ttl: '1h' } : { type: 'ephemeral' };
  return {
    providerOptions: {
      anthropic: { cacheControl: cc },
    },
  };
}

function findLastAssistantBeforeLastUser(convo: ModelMessage[]): number {
  const lastIdx = convo.length - 1;
  if (lastIdx < 0) return -1;
  const lastIsUser = convo[lastIdx]?.role === 'user';
  const scanUntil = lastIsUser ? lastIdx - 1 : lastIdx;
  for (let i = scanUntil; i >= 0; i--) {
    const role = convo[i]?.role;
    if (role === 'assistant' || role === 'tool') return i;
  }
  return -1;
}

function findMidCheckpointIdx(convo: ModelMessage[], prevAssistantIdx: number): number {
  const mid = Math.floor(convo.length / 2);
  for (let i = mid; i < convo.length - 1; i++) {
    if (i === prevAssistantIdx) continue;
    const role = convo[i]?.role;
    if (role === 'assistant' || role === 'tool') return i;
  }
  for (let i = mid - 1; i >= 0; i--) {
    if (i === prevAssistantIdx) continue;
    const role = convo[i]?.role;
    if (role === 'assistant' || role === 'tool') return i;
  }
  return -1;
}

export function buildMessages(
  systemPrompt: string,
  convo: ModelMessage[],
  cacheBreakpoint: boolean,
  options: CacheOptions,
): ModelMessage[] {
  const systemMsg: ModelMessage = cacheBreakpoint
    ? { role: 'system', content: systemPrompt, ...cacheControl(options.systemTtl) }
    : { role: 'system', content: systemPrompt };

  const prevAssistantIdx =
    cacheBreakpoint && options.markLastAssistant
      ? findLastAssistantBeforeLastUser(convo)
      : -1;

  const midCheckpointIdx =
    cacheBreakpoint &&
    options.longConvoCheckpoint.enabled &&
    convo.length > options.longConvoCheckpoint.threshold
      ? findMidCheckpointIdx(convo, prevAssistantIdx)
      : -1;

  const mapped = convo.map((m, idx) => {
    const isLast = idx === convo.length - 1;
    const isLastUser = isLast && m.role === 'user';
    if (isLastUser && cacheBreakpoint && options.markLastUser) {
      return { ...m, ...cacheControl('5m') };
    }
    if (idx === prevAssistantIdx) {
      return { ...m, ...cacheControl('5m') };
    }
    if (idx === midCheckpointIdx) {
      return { ...m, ...cacheControl('5m') };
    }
    return m;
  });

  return [systemMsg, ...mapped];
}
