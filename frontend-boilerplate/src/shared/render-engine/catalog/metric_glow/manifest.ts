/**
 * Manifesto do bloco `metric_glow` (shape 'scalar') — card de métrica com brilho.
 * Usa o Vitrine `MetricGlowCard`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'metric_glow',
  kind: 'chart',
  name: 'Métrica (glow)',
  description: 'Card de métrica única em destaque, com variação e efeito de brilho.',
  source: 'vitrine:metric-glow-card',
  propsSchema: { type: 'object', additionalProperties: false, properties: {} },
  dataContract: {
    shape: 'scalar',
    spec: {
      value: { type: 'number', required: true },
      label: { type: 'string', required: false },
      delta: { type: 'number', required: false },
    },
    example: { value: 124500, label: 'Receita do mês', unit: 'BRL', delta: 0.125 },
  },
  defaultProps: {},
  version: '1.0.0',
} satisfies BlockManifest;
