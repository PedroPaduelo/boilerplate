/**
 * Manifesto do bloco `bento_grid` (layout/decorativo) — grade "bento" com cards
 * de destaque. Usa o Vitrine `BentoGrid` + `BentoGridItem`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'bento_grid',
  kind: 'layout',
  name: 'Bento Grid',
  description: 'Grade de destaques em estilo "bento" — cards com cabeçalho visual, título e descrição.',
  source: 'vitrine:bento-grid',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['title'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
          },
        },
      },
    },
  },
  defaultProps: {
    items: [
      { title: 'Arrecadação em tempo real', description: 'Receita consolidada por tributo e período.' },
      { title: 'Inadimplência por zona', description: 'Regiões com maior atraso de pagamento.' },
      { title: 'Metas do trimestre', description: 'Progresso das metas por secretaria.' },
    ],
  },
  version: '1.0.0',
} satisfies BlockManifest;
