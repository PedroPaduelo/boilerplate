/**
 * Manifesto do bloco `rich_text` — bloco NARRATIVO (sem dados) em markdown
 * (análise do relatório). Sem `dataContract`. Alinhado a @dashboards/contracts.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'rich_text',
  kind: 'text',
  name: 'Texto rico',
  description: 'Bloco narrativo em markdown (análise do relatório). Sem dados.',
  source: 'custom',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['markdown'],
    properties: {
      markdown: { type: 'string' },
    },
  },
  defaultProps: { markdown: '' },
  version: '1.0.0',
} satisfies BlockManifest;
