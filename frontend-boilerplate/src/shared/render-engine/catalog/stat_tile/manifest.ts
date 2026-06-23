/**
 * Manifesto do bloco `stat_tile` (shape 'scalar') — ladrilho de estatística
 * compacto. Usa o Vitrine `StatTile`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'stat_tile',
  kind: 'chart',
  name: 'Stat Tile',
  description: 'Ladrilho compacto de estatística (valor + variação) para grades de KPIs.',
  source: 'vitrine:stat-tile',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: { hint: { type: 'string' } },
  },
  dataContract: {
    shape: 'scalar',
    spec: {
      value: { type: 'number', required: true },
      label: { type: 'string', required: false },
      delta: { type: 'number', required: false },
    },
    example: { value: 8420, label: 'Eventos hoje', delta: 0.06 },
  },
  defaultProps: {},
  version: '1.0.0',
} satisfies BlockManifest;
