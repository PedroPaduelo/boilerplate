/**
 * Manifesto do bloco `query_history` (layout) — histórico de queries SQL
 * recentes. Usa o Vitrine `QueryHistoryList`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'query_history',
  kind: 'layout',
  name: 'Histórico de Consultas',
  description: 'Histórico de queries SQL recentes com duração e horário.',
  source: 'vitrine:query-history-list',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'sql'],
          properties: {
            id: { type: 'string' },
            sql: { type: 'string' },
            durationMs: { type: 'integer' },
            timeLabel: { type: 'string' },
          },
        },
      },
    },
  },
  defaultProps: {
    items: [
      { id: '1', sql: 'SELECT tributo, SUM(valor) FROM arrecadacao GROUP BY tributo', durationMs: 42, timeLabel: 'há 2 min' },
      { id: '2', sql: 'SELECT * FROM divida_ativa WHERE situacao = $1', durationMs: 128, timeLabel: 'há 7 min' },
      { id: '3', sql: 'SELECT COUNT(*) FROM contribuintes WHERE ativo', durationMs: 15, timeLabel: 'há 18 min' },
      { id: '4', sql: 'SELECT mes, total FROM arrecadacao_mensal ORDER BY mes', durationMs: 63, timeLabel: 'há 1 h' },
    ],
  },
  version: '1.0.0',
} satisfies BlockManifest;
