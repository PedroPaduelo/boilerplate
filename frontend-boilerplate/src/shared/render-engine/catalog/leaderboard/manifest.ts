/**
 * Manifesto do bloco `leaderboard` (shape 'categorical') — ranking com posição,
 * avatar e barra proporcional ao líder. A lista é própria do bloco
 * (`leaderboard-list.tsx`), montada sobre o design system.
 *
 * Nomes e tipos das props são CONTRATO com o backend/agente e seguem iguais.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'leaderboard',
  kind: 'chart',
  name: 'Leaderboard',
  description:
    'Ranking (Top N) com posição, avatar e barra de progresso proporcional ao valor.',
  source: 'custom',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      unit: {
        type: 'string',
        description:
          'Unidade colada ao valor de cada linha (ex.: "pts", "atendimentos"). Vazio = só o número, formatado em PT-BR.',
      },
    },
  },
  dataContract: {
    shape: 'categorical',
    spec: {
      label: { type: 'category', required: true },
      value: { type: 'number', required: true },
    },
    example: [
      { label: 'Ana Souza', value: 1280 },
      { label: 'Bruno Lima', value: 980 },
    ],
  },
  defaultProps: {},
  maxRows: 1000,
  version: '1.0.0',
} satisfies BlockManifest;
