/**
 * Manifesto do bloco `connection_list` (layout) — lista de conexões/bancos com
 * indicador de status. Usa o Vitrine `ConnectionList`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'connection_list',
  kind: 'layout',
  name: 'Lista de Conexões',
  description: 'Lista de conexões/bancos com indicador de status e meta.',
  source: 'vitrine:connection-list',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      activeId: { type: 'string' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'name'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            meta: { type: 'string' },
            status: { type: 'string', enum: ['online', 'offline', 'warning'] },
          },
        },
      },
    },
  },
  defaultProps: {
    activeId: 'arrecadacao',
    items: [
      { id: 'arrecadacao', name: 'db_arrecadacao', meta: '24 schemas', status: 'online' },
      { id: 'divida', name: 'db_divida_ativa', meta: '12 schemas', status: 'online' },
      { id: 'rh', name: 'db_recursos_humanos', meta: '8 schemas', status: 'warning' },
      { id: 'legado', name: 'db_legado', meta: 'offline', status: 'offline' },
    ],
  },
  version: '1.0.0',
} satisfies BlockManifest;
