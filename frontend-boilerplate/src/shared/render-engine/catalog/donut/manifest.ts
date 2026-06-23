/**
 * Manifesto do bloco `donut` — distribuição de um total entre categorias
 * (shape 'categorical'). Alinhado a @dashboards/contracts.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'donut',
  kind: 'chart',
  name: 'Donut',
  description: 'Distribuição de um total entre categorias (label + value).',
  source: 'vitrine:donut-chart',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      showLegend: { type: 'boolean' },
      centerLabel: { type: 'string' },
      // ENTREGA 3: prop de palette — donut usa palette cíclica nativamente
      // (chart-1..5 por categoria), mas a prop fica no schema pra preparar
      // override (ex.: 'none' = sem cor, usar a default do UI base).
      palette: { type: 'string', enum: ['single', 'multi', 'none'], default: 'single' },
    },
  },
  dataContract: {
    shape: 'categorical',
    spec: {
      label: { type: 'category', required: true },
      value: { type: 'number', required: true },
    },
    example: [
      { label: 'Quitado', value: 62 },
      { label: 'Em aberto', value: 38 },
    ],
  },
  defaultProps: { showLegend: true, palette: 'single' },
  version: '1.0.0',
} satisfies BlockManifest;