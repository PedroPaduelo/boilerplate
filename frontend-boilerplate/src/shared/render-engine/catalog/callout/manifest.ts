/**
 * Manifesto do bloco `callout` (narrativo, sem dados) — banner de destaque com
 * variante semântica. Usa o Vitrine `CalloutTremor`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'callout',
  kind: 'text',
  name: 'Callout',
  description: 'Banner de destaque semântico (info/sucesso/aviso/erro) com título e texto.',
  source: 'vitrine:callout-tremor',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['title'],
    properties: {
      variant: { type: 'string', enum: ['default', 'info', 'success', 'warning', 'error'] },
      title: { type: 'string' },
      description: { type: 'string' },
    },
  },
  defaultProps: {
    variant: 'success',
    title: 'Meta atingida',
    description: 'A arrecadação do trimestre superou a meta em 8%.',
  },
  version: '1.0.0',
} satisfies BlockManifest;
