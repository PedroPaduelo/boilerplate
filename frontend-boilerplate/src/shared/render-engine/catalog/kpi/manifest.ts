/**
 * Manifesto do bloco `kpi` — métrica única (escalar). Alinhado ao
 * `kpiManifest`/`baseManifests` de @dashboards/contracts (fonte da verdade).
 * PURO (sem React): é o objeto que o `build:catalog` (BE) coleta.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'kpi',
  kind: 'chart',
  name: 'KPI',
  description: 'Métrica única (escalar) com rótulo e variação opcional.',
  source: 'vitrine:kpi-card',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      accent: { type: 'string' },
      icon: { type: 'string' },
      showDelta: { type: 'boolean' },
    },
  },
  dataContract: {
    shape: 'scalar',
    spec: {
      value: { type: 'number', required: true },
      label: { type: 'string', required: false },
      delta: { type: 'number', required: false },
    },
    example: { value: 1284000, label: 'Total arrecadado', unit: 'BRL', delta: 0.12 },
  },
  defaultProps: { showDelta: true },
  version: '1.0.0',
} satisfies BlockManifest;
