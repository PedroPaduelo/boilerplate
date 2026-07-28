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
  visibility: 'DEPARTMENT',
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

/**
 * Mesmo layout, agora com ABAS (doc 40). Existe para exercitar de uma vez os
 * três casos que o normalizador precisa aguentar:
 *
 *  - `tab_visao`   → duas linhas, ordem EXPLÍCITA e diferente da ordem de `rows`
 *    (prova que quem manda na ordem é `rowIds`, não a posição em `rows`);
 *  - `tab_detalhe` → cita um `rowId` INEXISTENTE (`row_fantasma`), que deve ser
 *    ignorado sem quebrar;
 *  - `row_detalhe` → linha ÓRFÃ (não citada por nenhuma aba), que deve ser
 *    recuperada na primeira aba — é o caso real de quando o agente insere uma
 *    linha via `add_chart_to_dashboard` sem saber que existem abas.
 *
 * Reusa as MESMAS `rows` do fixture legado de propósito: os dois fixtures têm
 * exatamente o mesmo conjunto de blocos, então dá para afirmar em teste que
 * ligar abas não muda o total de blocos renderizados.
 */
export const dashboardLayoutWithTabsFixture = {
  filters: dashboardConfigFixture.filters,
  rows: dashboardConfigFixture.rows,
  tabs: [
    { id: 'tab_visao', title: 'Visão geral', rowIds: ['row_evolucao', 'row_intro'] },
    { id: 'tab_detalhe', title: 'Detalhamento', rowIds: ['row_fantasma'] },
  ],
} satisfies DashboardLayout;
