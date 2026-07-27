/**
 * Catálogo de FIXTURES MÚLTIPLAS por bloco — playground do `/catalog`.
 *
 * Cada bloco do catálogo pode ter 3-5 variações de dados pré-prontas (além da
 * "default" que copia a `fixture.ts` oficial). O painel "Dados" do playground
 * expõe essas variações como um seletor pra trocar em tempo real — vale pra
 * inspecionar como o componente se comporta com:
 *   - muitas categorias (truncamento, scroll)
 *   - valores grandes (formatação compact BRL/number)
 *   - séries temporais longas (eixo X com datas reais)
 *   - multi-série (categoria × categoria)
 *   - valores flat (linha/série plana — testa comportamento do eixo Y)
 *   - pontos outliers / correlação forte (scatter)
 *
 * Este módulo é só o ÍNDICE: os dados moram em `./fixtures/*`, separados por
 * shape (`series` × `categorical`), porque juntos passavam de 700 linhas.
 *
 * Importante: NÃO mexe nas `fixture.ts` oficiais do render-engine. Cada bloco
 * tem `id: 'default'` como PRIMEIRA variante, e o `data` dela é uma CÓPIA
 * literal da fixture atual (mantemos paridade com o que a galeria carrega
 * antes de qualquer troca).
 *
 * Não-padrão: quando `getFixtureVariants(type)` devolve `[]` (bloco sem
 * variações ou bloco narrativo), o playground simplesmente NÃO mostra o
 * seletor.
 */
import type { DataShape } from '@dashboards/contracts';
import type { BlockFixtures, FixtureVariant } from './fixtures/types';
import {
  AREA_CHART_VARIANTS,
  BAR_CHART_VARIANTS,
  H_BAR_CHART_VARIANTS,
  LINE_CHART_VARIANTS,
  SCATTER_CHART_VARIANTS,
  SPARK_CHART_VARIANTS,
} from './fixtures/series-fixtures';
import { BAR_LIST_VARIANTS, DONUT_VARIANTS } from './fixtures/categorical-fixtures';

export type { BlockFixtures, FixtureVariant };

/**
 * Catálogo de variações por bloco. Apenas os 8 blocos da aba "Gráficos" (por
 * ora) — blocos de "Indicadores" (kpi, stat_tile) têm shape `scalar` e fazem
 * menos sentido demonstrar variações em massa; ficam num turno dedicado.
 *
 * Convenção: a PRIMEIRA variante é SEMPRE `id: 'default'` com `data` COPIADO
 * da `fixture.ts` oficial do bloco (paridade com o que o playground carrega
 * ao abrir).
 */
export const BLOCK_FIXTURES: BlockFixtures = {
  bar_chart: BAR_CHART_VARIANTS,
  h_bar_chart: H_BAR_CHART_VARIANTS,
  line_chart: LINE_CHART_VARIANTS,
  area_chart: AREA_CHART_VARIANTS,
  donut: DONUT_VARIANTS,
  scatter_chart: SCATTER_CHART_VARIANTS,
  spark_chart: SPARK_CHART_VARIANTS,
  bar_list: BAR_LIST_VARIANTS,
};

/** Devolve as variações disponíveis para um `catalogType`, ou `[]` se não houver. */
export function getFixtureVariants(type: string): FixtureVariant[] {
  return BLOCK_FIXTURES[type] ?? [];
}

/**
 * Devolve a variação default (id `'default'`), ou `undefined` se o bloco não
 * tiver variações cadastradas.
 */
export function getDefaultVariant(type: string): FixtureVariant | undefined {
  return getFixtureVariants(type).find((v) => v.id === 'default');
}

/** Re-export do `DataShape` pra conveniência de quem importa só deste módulo. */
export type { DataShape };
