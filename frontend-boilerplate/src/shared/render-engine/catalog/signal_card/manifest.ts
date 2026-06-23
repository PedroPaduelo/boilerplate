/**
 * Manifesto do bloco `signal_card` (shape 'series') — KPI com mini-sparkline e
 * tendência. Usa o Vitrine `SignalCard`. O valor em destaque é o último ponto
 * da série; a tendência compara o último com o primeiro.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'signal_card',
  kind: 'chart',
  name: 'Signal Card',
  description: 'KPI com mini-sparkline e tendência. Recebe uma série; destaca o último valor.',
  source: 'vitrine:signal-card',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      label: { type: 'string' },
      unit: { type: 'string' },
      trendPolarity: { type: 'string', enum: ['up-good', 'up-bad'] },
    },
  },
  dataContract: {
    shape: 'series',
    spec: {
      x: { type: 'category', required: false },
      y: { type: 'number', required: true },
    },
    example: [
      { x: '1', y: 48 },
      { x: '2', y: 62 },
    ],
  },
  defaultProps: { label: 'Sinal', trendPolarity: 'up-good' },
  maxRows: 1000,
  version: '1.0.0',
} satisfies BlockManifest;
