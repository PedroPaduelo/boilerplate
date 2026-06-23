/**
 * Manifesto do bloco `tooltip_fluid` (layout) — tooltip com animação suave.
 * Usa o Vitrine `TooltipFluid`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'tooltip_fluid',
  kind: 'layout',
  name: 'Tooltip Fluido',
  description: 'Tooltip com animação suave exibido ao focar/passar o mouse no gatilho.',
  source: 'vitrine:tooltip-fluid',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      triggerLabel: { type: 'string' },
      content: { type: 'string' },
      side: { type: 'string', enum: ['top', 'right', 'bottom', 'left'] },
    },
  },
  defaultProps: {
    triggerLabel: 'Passe o mouse',
    content: 'Receita acumulada no exercício',
    side: 'top',
  },
  version: '1.0.0',
} satisfies BlockManifest;
