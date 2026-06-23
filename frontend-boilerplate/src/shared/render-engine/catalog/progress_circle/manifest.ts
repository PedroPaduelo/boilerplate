/**
 * Manifesto do bloco `progress_circle` (shape 'scalar') — anel de progresso. Usa
 * o Vitrine `ProgressCircleTremor`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'progress_circle',
  kind: 'chart',
  name: 'Anel de Progresso',
  description: 'Progresso circular de um valor sobre uma escala (percentual no centro).',
  source: 'vitrine:progress-circle-tremor',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      max: { type: 'number' },
      variant: { type: 'string', enum: ['default', 'neutral', 'warning', 'error', 'success'] },
    },
  },
  dataContract: {
    shape: 'scalar',
    spec: {
      value: { type: 'number', required: true },
      label: { type: 'string', required: false },
    },
    example: { value: 75, label: 'Conclusão' },
  },
  defaultProps: { max: 100, variant: 'default' },
  version: '1.0.0',
} satisfies BlockManifest;
