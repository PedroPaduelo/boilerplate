/**
 * Manifesto do bloco `radial_gauge` (shape 'scalar') — medidor radial. Usa o
 * Vitrine `RadialGauge`. Ideal para metas/percentuais (valor sobre uma escala).
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'radial_gauge',
  kind: 'chart',
  name: 'Medidor Radial',
  description: 'Medidor (gauge) de um valor sobre uma escala — ótimo para metas e percentuais.',
  source: 'vitrine:radial-gauge',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      max: { type: 'number' },
      min: { type: 'number' },
      unit: { type: 'string' },
    },
  },
  dataContract: {
    shape: 'scalar',
    spec: {
      value: { type: 'number', required: true },
      label: { type: 'string', required: false },
      unit: { type: 'string', required: false },
    },
    example: { value: 72, label: 'Cobertura', unit: '%' },
  },
  defaultProps: { max: 100, min: 0 },
  version: '1.0.0',
} satisfies BlockManifest;
