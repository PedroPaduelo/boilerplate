/**
 * Fixture de DashboardConfig completo ("Dívida Ativa 2026"), espelhando o exemplo
 * do doc 20. Exercita: 2 filtros, 3 rows, e os 7 tipos de bloco da base — com
 * dataBinding nos blocos de dados e sem dataBinding nos narrativos (title/rich_text).
 */
import type { DashboardConfig, DashboardLayout } from '../types';

export const dashboardConfigFixture = {
  id: 'dash_divida_ativa_2026',
  version: 1,
  status: 'draft',
  title: 'Dívida Ativa 2026',
  ownerId: 'user_admin',
  departmentId: 'dep_fazenda',
  visibility: 'department',
  filters: [
    {
      id: 'f_periodo',
      type: 'date_range',
      label: 'Período',
      default: { from: '2026-01-01', to: '2026-12-31' },
    },
    {
      id: 'f_situacao',
      type: 'select',
      label: 'Situação',
      default: 'todas',
    },
  ],
  rows: [
    {
      id: 'row_intro',
      title: 'Visão geral',
      blocks: [
        {
          id: 'blk_title',
          type: 'title',
          span: 12,
          props: { text: 'Dívida Ativa — 2026', level: 1, align: 'left' },
        },
        {
          id: 'blk_kpi_total',
          type: 'kpi',
          span: 4,
          props: { showDelta: true },
          dataBinding: {
            connectionId: 'conn_fazenda',
            query: 'SELECT SUM(valor) AS value FROM divida_ativa WHERE ano = :periodo',
            params: [{ filterId: 'f_periodo', as: 'periodo' }],
            transform: 'scalar',
            ttlSeconds: 86400,
          },
        },
        {
          id: 'blk_bar_mes',
          type: 'bar_chart',
          span: 8,
          props: { orientation: 'vertical', stacked: false },
          dataBinding: {
            connectionId: 'conn_fazenda',
            query: 'SELECT mes AS x, SUM(valor) AS y FROM divida_ativa GROUP BY mes',
            params: [{ filterId: 'f_periodo', as: 'periodo' }],
            ttlSeconds: 3600,
          },
        },
      ],
    },
    {
      id: 'row_evolucao',
      title: 'Evolução e distribuição',
      blocks: [
        {
          id: 'blk_line',
          type: 'line_chart',
          span: 7,
          props: { smooth: true, area: false },
          dataBinding: {
            connectionId: 'conn_fazenda',
            query: 'SELECT competencia AS x, SUM(valor) AS y FROM divida_ativa GROUP BY competencia ORDER BY competencia',
            ttlSeconds: 3600,
          },
        },
        {
          id: 'blk_donut',
          type: 'donut',
          span: 5,
          props: { showLegend: true },
          dataBinding: {
            connectionId: 'conn_fazenda',
            query: 'SELECT situacao AS label, COUNT(*) AS value FROM divida_ativa GROUP BY situacao',
            params: [{ filterId: 'f_situacao', as: 'situacao' }],
            ttlSeconds: 3600,
          },
        },
      ],
    },
    {
      id: 'row_detalhe',
      title: 'Detalhamento',
      blocks: [
        {
          id: 'blk_rich',
          type: 'rich_text',
          span: 12,
          props: {
            markdown:
              '## Análise\nA arrecadação cresceu **12%** frente ao período anterior.',
          },
        },
        {
          id: 'blk_table',
          type: 'table',
          span: 12,
          props: { pageSize: 10, dense: false },
          dataBinding: {
            connectionId: 'conn_fazenda',
            query: 'SELECT municipio, SUM(valor) AS valor FROM divida_ativa GROUP BY municipio',
            ttlSeconds: 86400,
          },
        },
      ],
    },
  ],
} satisfies DashboardConfig;

/** Subset { filters, rows } salvo em Dashboard.draftLayout (ver modelagem 30). */
export const dashboardLayoutFixture = {
  filters: dashboardConfigFixture.filters,
  rows: dashboardConfigFixture.rows,
} satisfies DashboardLayout;
