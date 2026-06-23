/**
 * Manifesto do bloco `leaderboard` (shape 'categorical') — ranking com avatar,
 * posição e barra de progresso. Usa o Vitrine `LeaderboardList`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'leaderboard',
  kind: 'chart',
  name: 'Leaderboard',
  description: 'Ranking (Top N) com posição, avatar e barra de progresso proporcional ao valor.',
  source: 'vitrine:leaderboard-list',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: { unit: { type: 'string' } },
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
