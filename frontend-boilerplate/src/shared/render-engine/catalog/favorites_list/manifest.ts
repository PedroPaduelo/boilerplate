/**
 * Manifesto do bloco `favorites_list` (layout) — lista de itens favoritados.
 * Usa o Vitrine `FavoritesList`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'favorites_list',
  kind: 'layout',
  name: 'Lista de Favoritos',
  description: 'Lista de itens favoritados (estrela) com rótulo.',
  source: 'vitrine:favorites-list',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'label'],
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
          },
        },
      },
    },
  },
  defaultProps: {
    items: [
      { id: '1', label: 'public.contribuintes' },
      { id: '2', label: 'public.lancamentos' },
      { id: '3', label: 'public.divida_ativa' },
      { id: '4', label: 'fazenda.arrecadacao_mensal' },
    ],
  },
  version: '1.0.0',
} satisfies BlockManifest;
