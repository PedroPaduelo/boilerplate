/**
 * Manifesto do bloco `user_list` (layout) — lista de usuários com avatar,
 * e-mail e status. Usa o Vitrine `UserListItem`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'user_list',
  kind: 'layout',
  name: 'Lista de Usuários',
  description: 'Lista de usuários com avatar, e-mail, status e metadados.',
  source: 'vitrine:user-list-item',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      users: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['name'],
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            avatar: { type: 'string' },
            status: { type: 'string' },
            meta: { type: 'string' },
          },
        },
      },
    },
  },
  defaultProps: {
    users: [
      { name: 'Ana Souza', email: 'ana.souza@prefeitura.gov.br', avatar: 'https://i.pravatar.cc/80?img=47', status: 'Ativo', meta: 'Coordenação de Dados' },
      { name: 'Bruno Lima', email: 'bruno.lima@prefeitura.gov.br', avatar: 'https://i.pravatar.cc/80?img=12', status: 'Ativo', meta: 'BI' },
      { name: 'Carla Dias', email: 'carla.dias@prefeitura.gov.br', avatar: 'https://i.pravatar.cc/80?img=32', status: 'Férias', meta: 'Engenharia de Dados' },
      { name: 'Diego Alves', email: 'diego.alves@prefeitura.gov.br', avatar: 'https://i.pravatar.cc/80?img=68', status: 'Inativo', meta: 'Suporte' },
    ],
  },
  version: '1.0.0',
} satisfies BlockManifest;
