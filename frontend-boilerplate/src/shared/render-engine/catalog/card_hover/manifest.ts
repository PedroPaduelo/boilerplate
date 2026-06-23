/**
 * Manifesto do bloco `card_hover` (layout) — grade de cards com destaque
 * animado no hover. Usa o Vitrine `HoverEffect` (card-hover-effect).
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'card_hover',
  kind: 'layout',
  name: 'Cards com Hover',
  description: 'Grade de cards com destaque animado ao passar o mouse.',
  source: 'vitrine:card-hover-effect',
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
            link: { type: 'string' },
          },
        },
      },
    },
  },
  defaultProps: {
    items: [
      { title: 'Arrecadação', description: 'Receita consolidada por tributo.', link: '#' },
      { title: 'Dívida ativa', description: 'Estoque e recuperação da dívida ativa.', link: '#' },
      { title: 'Despesas', description: 'Execução orçamentária por órgão.', link: '#' },
    ],
  },
  version: '1.0.0',
} satisfies BlockManifest;
