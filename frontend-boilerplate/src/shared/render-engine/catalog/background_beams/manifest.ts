/**
 * Manifesto do bloco `background_beams` (layout/decorativo) — fundo animado com
 * feixes de luz e título por cima. Usa o Vitrine `BackgroundBeams`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'background_beams',
  kind: 'layout',
  name: 'Background Beams',
  description: 'Fundo animado com feixes de luz — capa/hero de relatório com título.',
  source: 'vitrine:background-beams',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: { type: 'string' },
      subtitle: { type: 'string' },
    },
  },
  defaultProps: {
    title: 'Inteligência de dados',
    subtitle: 'Transforme números em decisões para a gestão municipal.',
  },
  version: '1.0.0',
} satisfies BlockManifest;
