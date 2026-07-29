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

/**
 * Layout RICO — o mesmo dashboard escrito com TODAS as capacidades de
 * apresentação do contrato (doc 41). É a referência executável do que o agente
 * gerador pode escrever, e o corpo de prova de que nada disso é decorativo:
 * cada campo aqui muda alguma coisa na tela.
 *
 * O que ele exercita, e por quê:
 *
 *  - `theme`             → o dashboard escolhe a própria aparência e o acento;
 *  - `tabs[].group`      → duas seções nomeadas na navegação (não uma lista);
 *  - `tabs[].order`      → "Recuperação" aparece antes de "Cobrança" apesar de
 *                          estar depois no array — quem manda é a ordem, não a
 *                          posição;
 *  - `tabs[].level`      → "Por bairro" é sub-aba de "Cobrança";
 *  - `tabs[].divider`    → separa o consolidado dos detalhamentos;
 *  - `rows[].columns`    → a faixa de indicadores é declaradamente de 3;
 *  - `rows[].itemSizing` → a linha de análise usa `span` de propósito (um
 *                          gráfico grande + um estreito ao lado);
 *  - `blocks[].emphasis` → um KPI em destaque e um de apoio na MESMA faixa;
 *  - `blocks[].unit`     → "R$" e "%" aparecem sem invadir o título;
 *  - `blocks[].icon`     → ícone contrariando o padrão do tipo (um `bar_chart`
 *                          que fala de dinheiro).
 */
export const dashboardRichLayoutFixture = {
  theme: { colorMode: 'dark', accent: 'teal', palette: 'multi' },
  filters: dashboardConfigFixture.filters,
  rows: [
    {
      id: 'row_indicadores',
      title: 'Indicadores do período',
      description: 'Consolidado de arrecadação e recuperação da dívida ativa.',
      columns: 3,
      blocks: [
        {
          id: 'blk_kpi_arrecadado',
          type: 'kpi',
          span: 4,
          title: 'Arrecadado no período',
          unit: 'R$',
          emphasis: 'featured',
          props: { showDelta: true },
          dataBinding: {
            connectionId: 'conn_fazenda',
            query: 'SELECT SUM(valor) AS value FROM divida_ativa',
          },
        },
        {
          id: 'blk_kpi_recuperacao',
          type: 'kpi',
          span: 4,
          title: 'Taxa de recuperação',
          unit: '%',
          dataBinding: {
            connectionId: 'conn_fazenda',
            query: 'SELECT recuperado / total * 100 AS value FROM divida_resumo',
          },
        },
        {
          id: 'blk_kpi_protestos',
          type: 'kpi',
          span: 4,
          title: 'Protestos abertos',
          unit: 'processos',
          emphasis: 'muted',
          dataBinding: {
            connectionId: 'conn_fazenda',
            query: 'SELECT COUNT(*) AS value FROM protestos WHERE status = 1',
          },
        },
      ],
    },
    {
      id: 'row_analise',
      title: 'Análise mensal',
      itemSizing: 'span',
      blocks: [
        {
          id: 'blk_bar_mes_rico',
          type: 'bar_chart',
          span: 8,
          title: 'Arrecadação por mês',
          subtitle: 'Competência de janeiro a dezembro',
          description: 'Valores efetivamente baixados, sem parcelamentos em aberto.',
          unit: 'R$',
          icon: 'money',
          dataBinding: {
            connectionId: 'conn_fazenda',
            query: 'SELECT mes AS x, SUM(valor) AS y FROM divida_ativa GROUP BY mes',
          },
        },
        {
          id: 'blk_donut_situacao',
          type: 'donut',
          span: 4,
          title: 'Situação',
          unit: '%',
          dataBinding: {
            connectionId: 'conn_fazenda',
            query: 'SELECT situacao AS label, COUNT(*) AS value FROM divida_ativa GROUP BY situacao',
          },
        },
      ],
    },
    {
      id: 'row_bairro',
      title: 'Distribuição por bairro',
      blocks: [
        {
          id: 'blk_bar_bairro',
          type: 'h_bar_chart',
          span: 12,
          title: 'Dívida por bairro',
          unit: 'R$',
          dataBinding: {
            connectionId: 'conn_fazenda',
            query: 'SELECT bairro AS label, SUM(valor) AS value FROM divida_ativa GROUP BY bairro',
          },
        },
      ],
    },
  ],
  tabs: [
    {
      id: 'tab_cobranca',
      title: 'Cobrança',
      rowIds: ['row_analise'],
      icon: 'tax',
      description: 'Arrecadação mensal e composição por situação.',
      group: 'Arrecadação',
      order: 20,
    },
    {
      id: 'tab_recuperacao',
      title: 'Recuperação',
      rowIds: ['row_indicadores'],
      icon: 'money',
      description: 'Indicadores consolidados do período.',
      group: 'Arrecadação',
      order: 10,
    },
    {
      id: 'tab_bairro',
      title: 'Por bairro',
      rowIds: ['row_bairro'],
      icon: 'map',
      group: 'Território',
      level: 2,
      divider: true,
      order: 30,
    },
  ],
} satisfies DashboardLayout;
