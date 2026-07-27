/**
 * Variações de fixture dos blocos de shape `categorical` — `donut` e
 * `bar_list`.
 *
 * Só DADOS: cada variante é um cenário de teste visual (muitas categorias,
 * valores grandes, valores planos, negativos). Quem monta o mapa público
 * `catalogType → variantes` é `../block-fixtures`.
 */
import type { CategoricalData } from '@dashboards/contracts';
import type { FixtureVariant } from './types';

/* -------------------------------------------------------------------------- */
/*  Bloco: donut (shape: categorical)                                         */
/* -------------------------------------------------------------------------- */

const donutFixture: CategoricalData = [
  { label: 'Quitado', value: 62 },
  { label: 'Em aberto', value: 38 },
  { label: 'Parcelado', value: 24 },
];

export const DONUT_VARIANTS: FixtureVariant[] = [
  {
    id: 'default',
    label: 'Padrão',
    description: 'A fixture atual (3 categorias: Quitado, Em aberto, Parcelado).',
    data: donutFixture,
  },
  {
    id: 'large-values',
    label: 'Valores grandes',
    description: 'Receita por tributo (milhões — testa `compactBRL`).',
    data: [
      { label: 'IPTU', value: 4_200_000 },
      { label: 'ISS', value: 3_100_000 },
      { label: 'ITBI', value: 1_480_000 },
      { label: 'Taxas diversas', value: 2_150_000 },
      { label: 'Multas', value: 760_000 },
    ] satisfies CategoricalData,
  },
  {
    id: 'many-categories',
    label: 'Muitas categorias',
    description: '10 categorias (testa truncamento da legenda).',
    data: [
      { label: 'Quitado', value: 62 },
      { label: 'Em aberto', value: 38 },
      { label: 'Parcelado', value: 24 },
      { label: 'Em análise', value: 18 },
      { label: 'Suspenso', value: 12 },
      { label: 'Cancelado', value: 8 },
      { label: 'Em recurso', value: 6 },
      { label: 'Prescrito', value: 4 },
      { label: 'Judicial', value: 3 },
      { label: 'Outros', value: 2 },
    ] satisfies CategoricalData,
  },
  {
    id: 'flat-values',
    label: 'Valores planos',
    description: 'Todas as categorias com mesmo valor (testa fatia uniforme).',
    data: [
      { label: 'A', value: 100 },
      { label: 'B', value: 100 },
      { label: 'C', value: 100 },
      { label: 'D', value: 100 },
    ] satisfies CategoricalData,
  },
  {
    id: 'with-negative',
    label: 'Com negativos',
    description: 'Categoria com valor negativo (saldo devedor hipotético).',
    data: [
      { label: 'Recebido', value: 320 },
      { label: 'A receber', value: 180 },
      { label: 'Devolvido', value: -25 },
      { label: 'Cancelado', value: 10 },
    ] satisfies CategoricalData,
  },
];
/* -------------------------------------------------------------------------- */
/*  Bloco: bar_list (shape: categorical)                                      */
/* -------------------------------------------------------------------------- */

const barListFixture: CategoricalData = [
  { label: 'IPTU', value: 4200 },
  { label: 'ISS', value: 3100 },
  { label: 'Taxas diversas', value: 2150 },
  { label: 'ITBI', value: 1480 },
  { label: 'Multas', value: 760 },
];

export const BAR_LIST_VARIANTS: FixtureVariant[] = [
  {
    id: 'default',
    label: 'Padrão',
    description: 'A fixture atual (5 tributos, IPTU lidera).',
    data: barListFixture,
  },
  {
    id: 'large-values',
    label: 'Valores grandes',
    description: 'Receita por secretaria em R$ (milhões).',
    data: [
      { label: 'Saúde', value: 12_400_000 },
      { label: 'Educação', value: 9_800_000 },
      { label: 'Infraestrutura', value: 8_200_000 },
      { label: 'Administração', value: 4_600_000 },
      { label: 'Segurança', value: 3_100_000 },
    ] satisfies CategoricalData,
  },
  {
    id: 'many-categories',
    label: 'Muitas categorias',
    description: '10 secretarias (testa scroll e truncamento).',
    data: [
      { label: 'Fazenda', value: 4200 },
      { label: 'Saúde', value: 3800 },
      { label: 'Educação', value: 3400 },
      { label: 'Obras', value: 2900 },
      { label: 'Transporte', value: 2500 },
      { label: 'Cultura', value: 1800 },
      { label: 'Esporte', value: 1400 },
      { label: 'Procuradoria', value: 950 },
      { label: 'Controladoria', value: 720 },
      { label: 'Gabinete', value: 410 },
    ] satisfies CategoricalData,
  },
  {
    id: 'flat-values',
    label: 'Valores planos',
    description: 'Todas as categorias com mesmo valor.',
    data: [
      { label: 'Categoria A', value: 100 },
      { label: 'Categoria B', value: 100 },
      { label: 'Categoria C', value: 100 },
      { label: 'Categoria D', value: 100 },
    ] satisfies CategoricalData,
  },
];
