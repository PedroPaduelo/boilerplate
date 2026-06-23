/**
 * Manifesto do bloco `resizable_panels` (layout) — dois painéis com divisória
 * arrastável. Usa o Vitrine `ResizablePanelGroup` + `ResizablePanel`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'resizable_panels',
  kind: 'layout',
  name: 'Painéis Redimensionáveis',
  description: 'Dois painéis lado a lado com divisória arrastável.',
  source: 'vitrine:resizable',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      direction: { type: 'string', enum: ['horizontal', 'vertical'] },
      leftLabel: { type: 'string' },
      rightLabel: { type: 'string' },
    },
  },
  defaultProps: {
    direction: 'horizontal',
    leftLabel: 'Filtros',
    rightLabel: 'Resultado',
  },
  version: '1.0.0',
} satisfies BlockManifest;
