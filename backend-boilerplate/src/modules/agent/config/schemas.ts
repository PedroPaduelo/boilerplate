/**
 * Schemas zod para a config do motor do agente.
 * Adaptado do motor original (uploads/f1pfz-schemas.ts).
 */

import { z } from 'zod';

export const CacheTtlSchema = z.enum(['5m', '1h']);
export type CacheTtl = z.infer<typeof CacheTtlSchema>;

export const CacheOptionsSchema = z.object({
  systemTtl: CacheTtlSchema.default('5m'),
  toolsTtl: CacheTtlSchema.default('5m'),
  markLastUser: z.boolean().default(false),
  markLastAssistant: z.boolean().default(true),
  longConvoCheckpoint: z
    .object({
      enabled: z.boolean().default(true),
      threshold: z.number().int().positive().default(20),
    })
    .default({ enabled: true, threshold: 20 }),
});
export type CacheOptions = z.infer<typeof CacheOptionsSchema>;

export const AnthropicExtrasSchema = z.object({
  thinking: z
    .object({
      type: z.string(),
      budget_tokens: z.number().optional(),
    })
    .optional(),
  output_config: z
    .object({
      effort: z.enum(['low', 'medium', 'high', 'xhigh']).optional(),
    })
    .optional(),
  context_management: z
    .object({
      edits: z.array(z.record(z.string(), z.any())).optional(),
    })
    .optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  max_tokens: z.number().optional(),
  temperature: z.number().optional(),
  stream: z.boolean().optional(),
});
export type AnthropicExtras = z.infer<typeof AnthropicExtrasSchema>;

export const AgentModelConfigSchema = z.object({
  model: z.string().default('claude-sonnet-4-20250514'),
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
  cacheBreakpoint: z.boolean().default(true),
  cacheOptions: CacheOptionsSchema.default({
    systemTtl: '5m',
    toolsTtl: '5m',
    markLastUser: false,
    markLastAssistant: true,
    longConvoCheckpoint: { enabled: true, threshold: 20 },
  }),
  anthropicExtras: AnthropicExtrasSchema.optional(),
  maxSteps: z.number().optional().default(30),
});
export type AgentModelConfig = z.infer<typeof AgentModelConfigSchema>;

export const DEFAULT_AGENT_CONFIG: AgentModelConfig = AgentModelConfigSchema.parse({});
