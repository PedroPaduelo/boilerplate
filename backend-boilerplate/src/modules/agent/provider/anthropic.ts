/**
 * Wrapper do @ai-sdk/anthropic com cache_control, metadata e providerOptions.
 * Adaptado do motor original (uploads/f1url-anthropic.ts).
 */

import { createAnthropic } from '@ai-sdk/anthropic';
import type { AnthropicExtras } from '../config/schemas.js';

export interface AnthropicExtrasConfig {
  apiKey: string;
  baseURL: string;
  extras?: AnthropicExtras;
  toolsTtl?: '5m' | '1h';
  cacheTools?: boolean;
  debug?: boolean;
}

/**
 * Converte anthropicExtras (snake_case da config) para providerOptions.anthropic (camelCase).
 * O SDK adiciona os beta headers automaticamente.
 */
export function extrasToProviderOptions(
  extras: AnthropicExtras | undefined,
): { anthropic: Record<string, unknown> } | undefined {
  if (!extras) return undefined;
  const anthropic: Record<string, unknown> = {};

  if (extras.thinking) {
    if (extras.thinking.type === 'enabled') {
      anthropic.thinking = {
        type: 'enabled',
        ...(extras.thinking.budget_tokens !== undefined && {
          budgetTokens: extras.thinking.budget_tokens,
        }),
      };
    } else if (extras.thinking.type === 'adaptive' || extras.thinking.type === 'disabled') {
      anthropic.thinking = { type: extras.thinking.type };
    }
  }

  if (extras.output_config?.effort) {
    anthropic.effort = extras.output_config.effort;
  }

  if (extras.context_management?.edits && extras.context_management.edits.length > 0) {
    anthropic.contextManagement = {
      edits: extras.context_management.edits.map(convertEdit).filter(Boolean),
    };
  }

  if (extras.metadata?.user_id) {
    anthropic.metadata = { userId: extras.metadata.user_id };
  }

  return Object.keys(anthropic).length > 0 ? { anthropic } : undefined;
}

function convertEdit(edit: Record<string, unknown>): Record<string, unknown> | null {
  const type = edit.type as string | undefined;
  if (!type) return null;
  if (type === 'clear_thinking_20251015') {
    const out: Record<string, unknown> = { type };
    if (edit.keep !== undefined) out.keep = edit.keep;
    return out;
  }
  if (type === 'clear_tool_uses_20250919') {
    const out: Record<string, unknown> = { type };
    if (edit.trigger !== undefined) out.trigger = edit.trigger;
    if (edit.keep !== undefined) out.keep = edit.keep;
    if (edit.clear_at_least !== undefined) out.clearAtLeast = edit.clear_at_least;
    if (edit.clear_tool_inputs !== undefined) out.clearToolInputs = edit.clear_tool_inputs;
    if (edit.exclude_tools !== undefined) out.excludeTools = edit.exclude_tools;
    return out;
  }
  if (type === 'compact_20260112') {
    const out: Record<string, unknown> = { type };
    if (edit.trigger !== undefined) out.trigger = edit.trigger;
    if (edit.pause_after_compaction !== undefined) {
      out.pauseAfterCompaction = edit.pause_after_compaction;
    }
    if (edit.instructions !== undefined) out.instructions = edit.instructions;
    return out;
  }
  return { ...edit };
}

export function createAnthropicWithExtras(cfg: AnthropicExtrasConfig) {
  return createAnthropic({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseURL,
    fetch: async (input, init) => {
      if (!init?.body) return fetch(input, init);

      const url = typeof input === 'string' ? input : input.toString();
      if (!url.includes('/messages')) return fetch(input, init);

      try {
        const body = JSON.parse(init.body.toString());
        let mutated = false;

        if (cfg.extras?.metadata && cfg.extras.metadata.user_id) {
          const existing = (body.metadata as Record<string, unknown>) || {};
          body.metadata = { ...existing, user_id: cfg.extras.metadata.user_id };
          mutated = true;
        }

        if (cfg.cacheTools !== false && addToolsCacheBreakpoint(body, cfg.toolsTtl ?? '5m')) {
          mutated = true;
        }

        if (cfg.debug) {
          console.log('\n[AnthropicExtras] body final enviado ao proxy:');
          console.log(JSON.stringify(redactForLog(body), null, 2));
        }

        if (!mutated && !cfg.debug) return fetch(input, init);

        return fetch(input, {
          ...init,
          body: JSON.stringify(body),
        });
      } catch {
        return fetch(input, init);
      }
    },
  });
}

function addToolsCacheBreakpoint(body: Record<string, unknown>, ttl: '5m' | '1h'): boolean {
  const tools = body.tools;
  if (!Array.isArray(tools) || tools.length === 0) return false;
  const alreadyMarked = tools.some(
    (t) => t && typeof t === 'object' && (t as Record<string, unknown>).cache_control,
  );
  if (alreadyMarked) return false;
  const last = tools[tools.length - 1];
  if (last && typeof last === 'object') {
    (last as Record<string, unknown>).cache_control =
      ttl === '1h' ? { type: 'ephemeral', ttl: '1h' } : { type: 'ephemeral' };
    return true;
  }
  return false;
}

function redactForLog(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...body };
  if (Array.isArray(out.messages)) out.messages = `[${(out.messages as unknown[]).length} msgs]`;
  if (Array.isArray(out.tools)) out.tools = `[${(out.tools as unknown[]).length} tools]`;
  if (Array.isArray(out.system)) out.system = `[${(out.system as unknown[]).length} system blocks]`;
  return out;
}
