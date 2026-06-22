/**
 * Manifesto do bloco `title` — bloco NARRATIVO (sem dados). Tipografia de
 * título/seção. Sem `dataContract`. Alinhado a @dashboards/contracts.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'title',
  kind: 'title',
  name: 'Título',
  description: 'Bloco narrativo de título/seção. Sem dados.',
  source: 'custom',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['text'],
    properties: {
      text: { type: 'string' },
      level: { type: 'integer', minimum: 1, maximum: 6 },
      align: { type: 'string', enum: ['left', 'center', 'right'] },
    },
  },
  defaultProps: { level: 2, align: 'left' },
  version: '1.0.0',
} satisfies BlockManifest;
