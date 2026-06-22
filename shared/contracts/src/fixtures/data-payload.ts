/**
 * Fixture do payload de DADOS batch (resposta de POST /dashboards/:id/data e/ou
 * estado agregado dos eventos de socket). Cobre os 5 blocos de dados do dashboard
 * fixture, cada um no shape correto do seu manifesto. É contra ISTO que o FE
 * trabalha enquanto T-C (execução real) não existe.
 */
import type { DashboardDataPayload } from '../types';

export const dashboardDataPayloadFixture = {
  dashboardId: 'dash_divida_ativa_2026',
  version: 1,
  mode: 'dev',
  generatedAt: '2026-06-22T00:00:00.000Z',
  blocks: {
    blk_kpi_total: {
      blockId: 'blk_kpi_total',
      state: 'success',
      shape: 'scalar',
      data: { value: 1284000, label: 'Total arrecadado', unit: 'BRL', delta: 0.12 },
      meta: { cached: false, ttlSeconds: 86400, rowCount: 1, durationMs: 42 },
    },
    blk_bar_mes: {
      blockId: 'blk_bar_mes',
      state: 'success',
      shape: 'series',
      data: [
        { x: 'Jan', y: 120000 },
        { x: 'Fev', y: 98000 },
        { x: 'Mar', y: 145000 },
      ],
      meta: { cached: true, ttlSeconds: 3600, rowCount: 3, truncated: false },
    },
    blk_line: {
      blockId: 'blk_line',
      state: 'success',
      shape: 'series',
      data: [
        { x: '2026-01', y: 120000 },
        { x: '2026-02', y: 218000 },
        { x: '2026-03', y: 363000 },
      ],
    },
    blk_donut: {
      blockId: 'blk_donut',
      state: 'success',
      shape: 'categorical',
      data: [
        { label: 'Quitado', value: 62 },
        { label: 'Em aberto', value: 38 },
      ],
    },
    blk_table: {
      blockId: 'blk_table',
      state: 'queued',
    },
  },
} satisfies DashboardDataPayload;
