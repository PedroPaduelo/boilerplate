/**
 * Manifesto do bloco `hover_card` (layout) — cartão flutuante exibido no hover.
 * Usa o Vitrine `HoverCard`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'hover_card',
  kind: 'layout',
  name: 'Hover Card',
  description: 'Cartão flutuante exibido ao passar o mouse sobre o gatilho.',
  source: 'vitrine:hover-card',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      triggerLabel: { type: 'string' },
      title: { type: 'string' },
      content: { type: 'string' },
    },
  },
  defaultProps: {
    triggerLabel: '@prefeitura',
    title: 'Prefeitura Municipal',
    content: 'Portal de indicadores e relatórios da gestão municipal.',
  },
  version: '1.0.0',
} satisfies BlockManifest;
