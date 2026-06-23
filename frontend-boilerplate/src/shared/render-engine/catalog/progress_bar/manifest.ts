/**
 * Manifesto do bloco `progress_bar` (shape 'scalar') — barra de progresso. Usa o
 * Vitrine `ProgressBarTremor`. Bom para metas/percentuais (valor sobre `max`).
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'progress_bar',
  kind: 'chart',
  name: 'Barra de Progresso',
  description: 'Progresso de um valor sobre uma escala (ex.: 68 de 100). Ótimo para metas.',
  source: 'vitrine:progress-bar-tremor',
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
    example: { value: 68, label: 'Uso da cota' },
  },
  defaultProps: { max: 100, variant: 'default' },
  version: '1.0.0',
} satisfies BlockManifest;
