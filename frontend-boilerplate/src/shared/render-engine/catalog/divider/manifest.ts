/**
 * Manifesto do bloco `divider` (layout) — linha divisória com rótulo central
 * opcional. Usa o Vitrine `DividerTremor`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'divider',
  kind: 'layout',
  name: 'Divisor',
  description: 'Linha divisória com rótulo central opcional — separa seções de um relatório.',
  source: 'vitrine:divider-tremor',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      label: { type: 'string' },
      orientation: { type: 'string', enum: ['horizontal', 'vertical'] },
    },
  },
  defaultProps: {
    label: 'Resumo do período',
    orientation: 'horizontal',
  },
  version: '1.0.0',
} satisfies BlockManifest;
