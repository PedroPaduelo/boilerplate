/**
 * Dados simulados do agente (MOCK) — o ÚNICO lugar do projeto com mock.
 *
 * Constrói `ChatChartPayload`s para cada tipo de bloco do catálogo, reutilizando
 * os shapes do contrato (@dashboards/contracts). A T-H2 descarta este arquivo: a
 * API real devolverá os mesmos `ChatChartPayload` a partir do agente externo.
 */
import type { BlockDataResult, DataBinding } from '@dashboards/contracts';
import type { ChatChartPayload } from './types';

/** Tipos de gráfico que o agente mockado sabe "gerar". */
export type MockChartKind = 'kpi' | 'bar_chart' | 'line_chart' | 'donut' | 'table';

function binding(query: string, ttlSeconds = 3600): DataBinding {
  // connectionId é placeholder — o diálogo "adicionar ao dashboard" troca pela
  // conexão real escolhida pelo usuário antes de criar o Chart.
  return { connectionId: '__mock_connection__', query, ttlSeconds };
}

function result(
  blockId: string,
  shape: BlockDataResult['shape'],
  data: unknown,
): BlockDataResult {
  return {
    blockId,
    state: 'success',
    shape,
    data,
    meta: { cached: false, rowCount: Array.isArray(data) ? data.length : 1 },
  } as BlockDataResult;
}

const BUILDERS: Record<MockChartKind, () => ChatChartPayload> = {
  kpi: () => ({
    title: 'Total arrecadado (dívida ativa)',
    catalogType: 'kpi',
    props: { showDelta: true },
    result: result('mock_kpi', 'scalar', {
      value: 1284000,
      label: 'Total arrecadado',
      unit: 'BRL',
      delta: 0.12,
    }),
    dataBinding: binding(
      'SELECT SUM(valor) AS value FROM divida_ativa WHERE ano = 2026',
      86400,
    ),
  }),
  bar_chart: () => ({
    title: 'Arrecadação por mês',
    catalogType: 'bar_chart',
    props: { orientation: 'vertical', stacked: false },
    result: result('mock_bar', 'series', [
      { x: 'Jan', y: 120000 },
      { x: 'Fev', y: 98000 },
      { x: 'Mar', y: 145000 },
      { x: 'Abr', y: 132000 },
      { x: 'Mai', y: 151000 },
    ]),
    dataBinding: binding(
      'SELECT mes AS x, SUM(valor) AS y FROM divida_ativa GROUP BY mes ORDER BY mes',
    ),
  }),
  line_chart: () => ({
    title: 'Evolução acumulada da arrecadação',
    catalogType: 'line_chart',
    props: { smooth: true, area: false },
    result: result('mock_line', 'series', [
      { x: '2026-01', y: 120000 },
      { x: '2026-02', y: 218000 },
      { x: '2026-03', y: 363000 },
      { x: '2026-04', y: 495000 },
      { x: '2026-05', y: 646000 },
    ]),
    dataBinding: binding(
      'SELECT competencia AS x, SUM(valor) AS y FROM divida_ativa GROUP BY competencia ORDER BY competencia',
    ),
  }),
  donut: () => ({
    title: 'Distribuição por situação',
    catalogType: 'donut',
    props: { showLegend: true },
    result: result('mock_donut', 'categorical', [
      { label: 'Quitado', value: 62 },
      { label: 'Em aberto', value: 28 },
      { label: 'Parcelado', value: 10 },
    ]),
    dataBinding: binding(
      'SELECT situacao AS label, COUNT(*) AS value FROM divida_ativa GROUP BY situacao',
    ),
  }),
  table: () => ({
    title: 'Maiores devedores por município',
    catalogType: 'table',
    props: { pageSize: 10, dense: false },
    result: result('mock_table', 'table', {
      columns: [
        { key: 'municipio', label: 'Município' },
        { key: 'valor', label: 'Valor (BRL)' },
      ],
      rows: [
        { municipio: 'Município X', valor: 482000 },
        { municipio: 'Município Y', valor: 311000 },
        { municipio: 'Município Z', valor: 205000 },
      ],
    }),
    dataBinding: binding(
      'SELECT municipio, SUM(valor) AS valor FROM divida_ativa GROUP BY municipio ORDER BY valor DESC',
      86400,
    ),
  }),
};

/** Heurística simples: escolhe um tipo de gráfico a partir do texto do usuário. */
export function pickChartKind(text: string): MockChartKind {
  const t = text.toLowerCase();
  if (/(linha|evolu|tempo|tend[êe]ncia|acumulad)/.test(t)) return 'line_chart';
  if (/(distribu|propor|pizza|donut|rosca|percentu|fatia)/.test(t)) return 'donut';
  if (/(tabela|lista|detalh|ranking|maiores|devedor)/.test(t)) return 'table';
  if (/(kpi|indicador|total|soma|m[ée]trica|n[úu]mero)/.test(t)) return 'kpi';
  // padrão: barras (comparação entre categorias).
  return 'bar_chart';
}

/** Constrói o payload de gráfico mockado para um tipo. */
export function buildMockChart(kind: MockChartKind): ChatChartPayload {
  return BUILDERS[kind]();
}

/** Heurística: a mensagem do usuário pede um gráfico/relatório/dado? */
export function wantsChart(text: string): boolean {
  const t = text.toLowerCase();
  return /(gr[áa]fico|relat[óo]rio|dado|chart|kpi|tabela|distribu|evolu|arrecad|d[íi]vida|total|compar|mostra|quero|gera)/.test(
    t,
  );
}
