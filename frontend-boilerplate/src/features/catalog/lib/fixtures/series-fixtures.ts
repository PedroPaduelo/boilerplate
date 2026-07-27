/**
 * Variações de fixture dos blocos de shape `series` — `bar_chart`,
 * `h_bar_chart`, `line_chart`, `area_chart`, `scatter_chart` e `spark_chart`.
 *
 * Só DADOS: cada variante é um cenário de teste visual (multi-série, valores
 * grandes, série longa, valores planos, negativos, outliers). Quem monta o mapa
 * público `catalogType → variantes` é `../block-fixtures`.
 */
import type { SeriesData } from '@dashboards/contracts';
import type { FixtureVariant } from './types';

/* -------------------------------------------------------------------------- */
/*  Bloco: bar_chart  (shape: series, x categórico)                           */
/* -------------------------------------------------------------------------- */

const barChartFixture: SeriesData = [
  { x: 'Jan', y: 120 },
  { x: 'Fev', y: 90 },
  { x: 'Mar', y: 150 },
  { x: 'Abr', y: 80 },
  { x: 'Mai', y: 110 },
];

export const BAR_CHART_VARIANTS: FixtureVariant[] = [
  {
    id: 'default',
    label: 'Padrão',
    description: 'A fixture atual do bloco (Jan–Mai, 80–150).',
    data: barChartFixture,
  },
  {
    id: 'multi-series',
    label: 'Multi-série',
    description: 'Receita × Despesa por mês (testa agrupamento por `series`).',
    data: [
      { x: 'Jan', y: 120, series: 'Receita' },
      { x: 'Jan', y: 95, series: 'Despesa' },
      { x: 'Fev', y: 138, series: 'Receita' },
      { x: 'Fev', y: 110, series: 'Despesa' },
      { x: 'Mar', y: 131, series: 'Receita' },
      { x: 'Mar', y: 99, series: 'Despesa' },
      { x: 'Abr', y: 165, series: 'Receita' },
      { x: 'Abr', y: 104, series: 'Despesa' },
      { x: 'Mai', y: 182, series: 'Receita' },
      { x: 'Mai', y: 118, series: 'Despesa' },
    ] satisfies SeriesData,
  },
  {
    id: 'large-values',
    label: 'Valores grandes',
    description: 'Arrecadação municipal em R$ (milhões — testa `compactBRL`).',
    data: [
      { x: '2024', y: 1_200_000 },
      { x: '2025', y: 980_000 },
      { x: '2026', y: 1_450_000 },
      { x: '2027', y: 1_120_000 },
    ] satisfies SeriesData,
  },
  {
    id: 'with-dates',
    label: 'Com datas',
    description: 'Labels com meses reais (eixo X temporal-like).',
    data: [
      { x: '2024-01', y: 80 },
      { x: '2024-02', y: 110 },
      { x: '2024-03', y: 95 },
      { x: '2024-04', y: 130 },
      { x: '2024-05', y: 145 },
      { x: '2024-06', y: 120 },
      { x: '2024-07', y: 160 },
      { x: '2024-08', y: 175 },
      { x: '2024-09', y: 140 },
      { x: '2024-10', y: 190 },
      { x: '2024-11', y: 210 },
      { x: '2024-12', y: 250 },
    ] satisfies SeriesData,
  },
  {
    id: 'flat-values',
    label: 'Valores planos',
    description: 'Todos os meses com mesmo valor (testa eixo Y degenerado).',
    data: [
      { x: 'Jan', y: 100 },
      { x: 'Fev', y: 100 },
      { x: 'Mar', y: 100 },
      { x: 'Abr', y: 100 },
      { x: 'Mai', y: 100 },
    ] satisfies SeriesData,
  },
];

/* -------------------------------------------------------------------------- */
/*  Bloco: h_bar_chart (shape: series, x categórico, sem `series`)            */
/* -------------------------------------------------------------------------- */

const hBarChartFixture: SeriesData = [
  { x: 'Centro', y: 1200 },
  { x: 'Norte', y: 980 },
  { x: 'Sul', y: 870 },
  { x: 'Leste', y: 640 },
  { x: 'Oeste', y: 520 },
];

export const H_BAR_CHART_VARIANTS: FixtureVariant[] = [
  {
    id: 'default',
    label: 'Padrão',
    description: 'A fixture atual (5 regiões com 1200 → 520).',
    data: hBarChartFixture,
  },
  {
    id: 'large-values',
    label: 'Valores grandes',
    description: 'Receita por secretaria (milhões — testa `compactNumberBR`).',
    data: [
      { x: 'Saúde', y: 12_400_000 },
      { x: 'Educação', y: 9_800_000 },
      { x: 'Infraestrutura', y: 8_200_000 },
      { x: 'Administração', y: 4_600_000 },
      { x: 'Segurança', y: 3_100_000 },
    ] satisfies SeriesData,
  },
  {
    id: 'many-categories',
    label: 'Muitas categorias',
    description: '10 secretarias (testa truncamento e scroll do label).',
    data: [
      { x: 'Secretaria da Fazenda', y: 1200 },
      { x: 'Secretaria de Saúde', y: 1100 },
      { x: 'Secretaria de Educação', y: 980 },
      { x: 'Secretaria de Obras', y: 870 },
      { x: 'Secretaria de Transporte', y: 760 },
      { x: 'Secretaria de Cultura', y: 640 },
      { x: 'Secretaria de Esporte', y: 520 },
      { x: 'Procuradoria Geral', y: 410 },
      { x: 'Controladoria Geral', y: 290 },
      { x: 'Gabinete do Prefeito', y: 180 },
    ] satisfies SeriesData,
  },
  {
    id: 'flat-values',
    label: 'Valores planos',
    description: 'Todas as categorias com mesmo valor (testa barra uniforme).',
    data: [
      { x: 'Centro', y: 500 },
      { x: 'Norte', y: 500 },
      { x: 'Sul', y: 500 },
      { x: 'Leste', y: 500 },
      { x: 'Oeste', y: 500 },
    ] satisfies SeriesData,
  },
];

/* -------------------------------------------------------------------------- */
/*  Bloco: line_chart (shape: series, x temporal)                             */
/* -------------------------------------------------------------------------- */

const lineChartFixture: SeriesData = [
  { x: '2026-01', y: 12 },
  { x: '2026-02', y: 18 },
  { x: '2026-03', y: 15 },
  { x: '2026-04', y: 24 },
  { x: '2026-05', y: 30 },
  { x: '2026-06', y: 28 },
];

export const LINE_CHART_VARIANTS: FixtureVariant[] = [
  {
    id: 'default',
    label: 'Padrão',
    description: 'A fixture atual (6 meses, 12 → 28 → 30).',
    data: lineChartFixture,
  },
  {
    id: 'with-dates',
    label: 'Com datas (12 meses)',
    description: 'Série temporal de 1 ano (2024-01..2024-12).',
    data: [
      { x: '2024-01', y: 80 },
      { x: '2024-02', y: 95 },
      { x: '2024-03', y: 110 },
      { x: '2024-04', y: 105 },
      { x: '2024-05', y: 130 },
      { x: '2024-06', y: 145 },
      { x: '2024-07', y: 138 },
      { x: '2024-08', y: 160 },
      { x: '2024-09', y: 175 },
      { x: '2024-10', y: 165 },
      { x: '2024-11', y: 190 },
      { x: '2024-12', y: 210 },
    ] satisfies SeriesData,
  },
  {
    id: 'multi-series',
    label: 'Multi-série',
    description: '3 séries (Receita, Despesa, Investimento) ao longo de 6 meses.',
    data: [
      { x: '2024-01', y: 120, series: 'Receita' },
      { x: '2024-01', y: 95, series: 'Despesa' },
      { x: '2024-01', y: 30, series: 'Investimento' },
      { x: '2024-02', y: 138, series: 'Receita' },
      { x: '2024-02', y: 102, series: 'Despesa' },
      { x: '2024-02', y: 42, series: 'Investimento' },
      { x: '2024-03', y: 131, series: 'Receita' },
      { x: '2024-03', y: 99, series: 'Despesa' },
      { x: '2024-03', y: 38, series: 'Investimento' },
      { x: '2024-04', y: 165, series: 'Receita' },
      { x: '2024-04', y: 110, series: 'Despesa' },
      { x: '2024-04', y: 55, series: 'Investimento' },
      { x: '2024-05', y: 182, series: 'Receita' },
      { x: '2024-05', y: 125, series: 'Despesa' },
      { x: '2024-05', y: 62, series: 'Investimento' },
      { x: '2024-06', y: 176, series: 'Receita' },
      { x: '2024-06', y: 118, series: 'Despesa' },
      { x: '2024-06', y: 58, series: 'Investimento' },
    ] satisfies SeriesData,
  },
  {
    id: 'flat-values',
    label: 'Valores planos',
    description: 'Linha plana (testa comportamento do eixo Y degenerado).',
    data: [
      { x: '2024-01', y: 100 },
      { x: '2024-02', y: 100 },
      { x: '2024-03', y: 100 },
      { x: '2024-04', y: 100 },
      { x: '2024-05', y: 100 },
      { x: '2024-06', y: 100 },
    ] satisfies SeriesData,
  },
  {
    id: 'with-negative',
    label: 'Com negativos',
    description: 'Sazonalidade com valor negativo no meio (testa eixo Y).',
    data: [
      { x: '2024-01', y: 120 },
      { x: '2024-02', y: 80 },
      { x: '2024-03', y: -30 },
      { x: '2024-04', y: -60 },
      { x: '2024-05', y: 40 },
      { x: '2024-06', y: 150 },
    ] satisfies SeriesData,
  },
];

/* -------------------------------------------------------------------------- */
/*  Bloco: area_chart (shape: series, x temporal, multi-série friendly)       */
/* -------------------------------------------------------------------------- */

const areaChartFixture: SeriesData = [
  { x: '2026-01', y: 120, series: 'Receita' },
  { x: '2026-01', y: 82, series: 'Despesa' },
  { x: '2026-02', y: 138, series: 'Receita' },
  { x: '2026-02', y: 95, series: 'Despesa' },
  { x: '2026-03', y: 131, series: 'Receita' },
  { x: '2026-03', y: 99, series: 'Despesa' },
  { x: '2026-04', y: 165, series: 'Receita' },
  { x: '2026-04', y: 104, series: 'Despesa' },
  { x: '2026-05', y: 182, series: 'Receita' },
  { x: '2026-05', y: 118, series: 'Despesa' },
  { x: '2026-06', y: 176, series: 'Receita' },
  { x: '2026-06', y: 121, series: 'Despesa' },
];

export const AREA_CHART_VARIANTS: FixtureVariant[] = [
  {
    id: 'default',
    label: 'Padrão',
    description: 'A fixture atual (Receita × Despesa, 6 meses).',
    data: areaChartFixture,
  },
  {
    id: 'with-dates',
    label: 'Com datas (12 meses)',
    description: 'Receita × Despesa × Investimento em 1 ano.',
    data: [
      { x: '2024-01', y: 120, series: 'Receita' },
      { x: '2024-01', y: 95, series: 'Despesa' },
      { x: '2024-01', y: 30, series: 'Investimento' },
      { x: '2024-02', y: 138, series: 'Receita' },
      { x: '2024-02', y: 102, series: 'Despesa' },
      { x: '2024-02', y: 42, series: 'Investimento' },
      { x: '2024-03', y: 131, series: 'Receita' },
      { x: '2024-03', y: 99, series: 'Despesa' },
      { x: '2024-03', y: 38, series: 'Investimento' },
      { x: '2024-04', y: 165, series: 'Receita' },
      { x: '2024-04', y: 110, series: 'Despesa' },
      { x: '2024-04', y: 55, series: 'Investimento' },
      { x: '2024-05', y: 182, series: 'Receita' },
      { x: '2024-05', y: 125, series: 'Despesa' },
      { x: '2024-05', y: 62, series: 'Investimento' },
      { x: '2024-06', y: 176, series: 'Receita' },
      { x: '2024-06', y: 118, series: 'Despesa' },
      { x: '2024-06', y: 58, series: 'Investimento' },
      { x: '2024-07', y: 190, series: 'Receita' },
      { x: '2024-07', y: 130, series: 'Despesa' },
      { x: '2024-07', y: 68, series: 'Investimento' },
      { x: '2024-08', y: 205, series: 'Receita' },
      { x: '2024-08', y: 140, series: 'Despesa' },
      { x: '2024-08', y: 75, series: 'Investimento' },
      { x: '2024-09', y: 195, series: 'Receita' },
      { x: '2024-09', y: 132, series: 'Despesa' },
      { x: '2024-09', y: 70, series: 'Investimento' },
      { x: '2024-10', y: 220, series: 'Receita' },
      { x: '2024-10', y: 145, series: 'Despesa' },
      { x: '2024-10', y: 82, series: 'Investimento' },
      { x: '2024-11', y: 235, series: 'Receita' },
      { x: '2024-11', y: 155, series: 'Despesa' },
      { x: '2024-11', y: 90, series: 'Investimento' },
      { x: '2024-12', y: 260, series: 'Receita' },
      { x: '2024-12', y: 170, series: 'Despesa' },
      { x: '2024-12', y: 100, series: 'Investimento' },
    ] satisfies SeriesData,
  },
  {
    id: 'single-series',
    label: 'Série única',
    description: 'Sem campo `series` (testa fallback do agrupador).',
    data: [
      { x: '2024-01', y: 80 },
      { x: '2024-02', y: 95 },
      { x: '2024-03', y: 110 },
      { x: '2024-04', y: 130 },
      { x: '2024-05', y: 145 },
      { x: '2024-06', y: 160 },
    ] satisfies SeriesData,
  },
  {
    id: 'large-values',
    label: 'Valores grandes',
    description: 'Receita municipal em R$ (milhões).',
    data: [
      { x: '2024', y: 1_200_000 },
      { x: '2025', y: 980_000 },
      { x: '2026', y: 1_450_000 },
      { x: '2027', y: 1_120_000 },
    ] satisfies SeriesData,
  },
  {
    id: 'flat-values',
    label: 'Valores planos',
    description: 'Séries constantes (testa área degenerada).',
    data: [
      { x: '2024-01', y: 100, series: 'Receita' },
      { x: '2024-01', y: 80, series: 'Despesa' },
      { x: '2024-02', y: 100, series: 'Receita' },
      { x: '2024-02', y: 80, series: 'Despesa' },
      { x: '2024-03', y: 100, series: 'Receita' },
      { x: '2024-03', y: 80, series: 'Despesa' },
    ] satisfies SeriesData,
  },
];
/* -------------------------------------------------------------------------- */
/*  Bloco: scatter_chart (shape: series, x/y numéricos)                       */
/* -------------------------------------------------------------------------- */

const scatterChartFixture: SeriesData = [
  { x: 12, y: 40, series: 'Zona A' },
  { x: 20, y: 52, series: 'Zona A' },
  { x: 28, y: 49, series: 'Zona A' },
  { x: 35, y: 70, series: 'Zona A' },
  { x: 16, y: 30, series: 'Zona B' },
  { x: 24, y: 38, series: 'Zona B' },
  { x: 33, y: 44, series: 'Zona B' },
  { x: 42, y: 60, series: 'Zona B' },
];

export const SCATTER_CHART_VARIANTS: FixtureVariant[] = [
  {
    id: 'default',
    label: 'Padrão',
    description: 'A fixture atual (Zona A × Zona B, 8 pontos).',
    data: scatterChartFixture,
  },
  {
    id: 'correlation-strong',
    label: 'Correlação forte',
    description: 'Pontos alinhados (testa inclinação clara y=f(x)).',
    data: [
      { x: 10, y: 15, series: 'Linear' },
      { x: 20, y: 28, series: 'Linear' },
      { x: 30, y: 38, series: 'Linear' },
      { x: 40, y: 52, series: 'Linear' },
      { x: 50, y: 63, series: 'Linear' },
      { x: 60, y: 75, series: 'Linear' },
    ] satisfies SeriesData,
  },
  {
    id: 'with-outliers',
    label: 'Com outliers',
    description: 'Pontos dispersos + 2 outliers distantes da nuvem.',
    data: [
      { x: 12, y: 40, series: 'Zona A' },
      { x: 20, y: 52, series: 'Zona A' },
      { x: 28, y: 49, series: 'Zona A' },
      { x: 35, y: 70, series: 'Zona A' },
      { x: 16, y: 30, series: 'Zona B' },
      { x: 24, y: 38, series: 'Zona B' },
      { x: 33, y: 44, series: 'Zona B' },
      { x: 42, y: 60, series: 'Zona B' },
      { x: 90, y: 5, series: 'Outlier' },
      { x: 95, y: 200, series: 'Outlier' },
    ] satisfies SeriesData,
  },
  {
    id: 'single-series',
    label: 'Série única',
    description: 'Sem campo `series` (testa fallback de categoria única).',
    data: [
      { x: 10, y: 15 },
      { x: 20, y: 28 },
      { x: 30, y: 38 },
      { x: 40, y: 52 },
      { x: 50, y: 63 },
    ] satisfies SeriesData,
  },
  {
    id: 'large-values',
    label: 'Valores grandes',
    description: 'População × Receita em milhares (testa formatador de eixo).',
    data: [
      { x: 1_200, y: 8_500, series: 'Norte' },
      { x: 4_500, y: 22_000, series: 'Norte' },
      { x: 9_800, y: 48_000, series: 'Norte' },
      { x: 2_100, y: 12_000, series: 'Sul' },
      { x: 6_300, y: 31_000, series: 'Sul' },
      { x: 12_500, y: 58_000, series: 'Sul' },
    ] satisfies SeriesData,
  },
];

/* -------------------------------------------------------------------------- */
/*  Bloco: spark_chart (shape: series, sem `series`)                          */
/* -------------------------------------------------------------------------- */

const sparkChartFixture: SeriesData = [
  { x: '1', y: 8 },
  { x: '2', y: 12 },
  { x: '3', y: 9 },
  { x: '4', y: 15 },
  { x: '5', y: 14 },
  { x: '6', y: 22 },
  { x: '7', y: 19 },
  { x: '8', y: 28 },
];

export const SPARK_CHART_VARIANTS: FixtureVariant[] = [
  {
    id: 'default',
    label: 'Padrão',
    description: 'A fixture atual (8 pontos, 8 → 28).',
    data: sparkChartFixture,
  },
  {
    id: 'large-values',
    label: 'Valores grandes',
    description: 'Arrecadação diária em R$ (milhões).',
    data: [
      { x: '1', y: 1_200_000 },
      { x: '2', y: 1_350_000 },
      { x: '3', y: 1_180_000 },
      { x: '4', y: 1_600_000 },
      { x: '5', y: 1_550_000 },
      { x: '6', y: 1_900_000 },
      { x: '7', y: 1_750_000 },
      { x: '8', y: 2_100_000 },
    ] satisfies SeriesData,
  },
  {
    id: 'flat-values',
    label: 'Valores planos',
    description: 'Tendência totalmente plana.',
    data: [
      { x: '1', y: 100 },
      { x: '2', y: 100 },
      { x: '3', y: 100 },
      { x: '4', y: 100 },
      { x: '5', y: 100 },
    ] satisfies SeriesData,
  },
  {
    id: 'with-negative',
    label: 'Com negativos',
    description: 'Pico negativo no meio (testa sparkline com eixo Y cruzado).',
    data: [
      { x: '1', y: 30 },
      { x: '2', y: 45 },
      { x: '3', y: 20 },
      { x: '4', y: -10 },
      { x: '5', y: -25 },
      { x: '6', y: 10 },
      { x: '7', y: 35 },
      { x: '8', y: 50 },
    ] satisfies SeriesData,
  },
  {
    id: 'long-series',
    label: 'Série longa (30 pontos)',
    description: '30 dias (testa densidade da curva em altura pequena).',
    data: Array.from({ length: 30 }, (_, i) => ({
      x: String(i + 1),
      y: Math.round(50 + 30 * Math.sin(i / 3) + i * 2),
    })) satisfies SeriesData,
  },
];
