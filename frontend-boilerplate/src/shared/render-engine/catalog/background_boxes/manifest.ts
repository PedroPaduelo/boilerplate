/**
 * Manifesto do bloco `background_boxes` (layout/decorativo) — fundo isométrico
 * de células que acendem no hover, com título. Usa o Vitrine `Boxes`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'background_boxes',
  kind: 'layout',
  name: 'Background Boxes',
  description: 'Fundo isométrico de células que acendem no hover — capa decorativa com título.',
  source: 'vitrine:background-boxes',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: { type: 'string' },
      subtitle: { type: 'string' },
    },
  },
  defaultProps: {
    title: 'Painel da Prefeitura',
    subtitle: 'Indicadores e relatórios em um só lugar.',
  },
  version: '1.0.0',
} satisfies BlockManifest;
