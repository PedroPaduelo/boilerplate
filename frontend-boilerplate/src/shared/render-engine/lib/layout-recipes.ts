/**
 * RECEITAS DE COMPOSIÇÃO — os arranjos prontos que o agente reusa.
 *
 * São blocos `grid` já montados, com os filhos que cada arranjo pressupõe.
 * Existem em código (e não apenas na `description` do manifesto) por dois
 * motivos:
 *
 *  1. O que está em código é TESTADO. Uma receita que só vive num texto de
 *     prompt apodrece em silêncio quando as props mudam; esta quebra o teste.
 *  2. São a resposta curta para "como faço duas colunas?" — a pergunta que o
 *     agente refaz a cada dashboard. Copiar um arranjo conhecido produz layout
 *     previsível; improvisar `span` produz o que a queixa descreve.
 *
 * NENHUMA receita escreve `columns` ou `rowHeight`: as duas props existem para
 * FORÇAR algo, e o comportamento padrão (uma coluna por filho, altura derivada
 * do tipo) já é o desejado. A exceção é `duasColunas`, que fixa `columns: 2`
 * exatamente porque o pedido é "sempre em pares, nunca 3 numa linha".
 *
 * Os `dataBinding` ficam de fora de propósito: a receita é o ESQUELETO de
 * layout, e quem preenche a consulta é quem monta o dashboard.
 */
import type { Block } from '@dashboards/contracts';

/** Identificador de uma receita. */
export type LayoutRecipeId =
  | 'uma_coluna'
  | 'duas_colunas'
  | 'tres_colunas'
  | 'kpis_e_graficos';

export interface LayoutRecipe {
  id: LayoutRecipeId;
  /** Nome curto, como aparece para quem escolhe. */
  name: string;
  /** Quando usar — a frase que decide entre uma receita e outra. */
  when: string;
  /** O bloco pronto para colar em `row.blocks` (ou em `block.blocks`). */
  block: Block;
}

/**
 * `span: 12` é o vocabulário de "linha inteira" no modo `equal` — o único
 * `span` que o grid ainda lê. Os demais filhos usam um valor qualquer (aqui,
 * 12 também, por consistência) porque a largura vem da grade, não deles.
 */
const FULL: number = 12;

const RECIPES: Record<LayoutRecipeId, LayoutRecipe> = {
  /* ---------------------------------------------------------------------- *
   * 1 COLUNA — leitura sequencial
   * ---------------------------------------------------------------------- */
  uma_coluna: {
    id: 'uma_coluna',
    name: '1 coluna',
    when: 'Narrativa: cada bloco ocupa a largura toda e é lido em sequência. Tabelas largas e séries longas pedem isto.',
    block: {
      id: 'grid_uma_coluna',
      type: 'grid',
      span: FULL,
      props: { columns: 1 },
      blocks: [
        { id: 'uma_coluna_titulo', type: 'title', span: FULL },
        { id: 'uma_coluna_serie', type: 'line_chart', span: FULL },
        { id: 'uma_coluna_tabela', type: 'data_table', span: FULL },
      ],
    },
  },

  /* ---------------------------------------------------------------------- *
   * 2 COLUNAS — comparação em pares
   * ---------------------------------------------------------------------- */
  duas_colunas: {
    id: 'duas_colunas',
    name: '2 colunas',
    when: 'Comparar dois recortes do mesmo assunto. `columns: 2` mantém o par mesmo com 4 filhos — dois pares empilhados, nunca 3 + 1.',
    block: {
      id: 'grid_duas_colunas',
      type: 'grid',
      span: FULL,
      props: { columns: 2 },
      blocks: [
        { id: 'duas_colunas_a', type: 'bar_chart', span: FULL },
        { id: 'duas_colunas_b', type: 'donut', span: FULL },
      ],
    },
  },

  /* ---------------------------------------------------------------------- *
   * 3 COLUNAS — panorama
   * ---------------------------------------------------------------------- */
  tres_colunas: {
    id: 'tres_colunas',
    name: '3 colunas',
    when: 'Panorama: três recortes lado a lado, o teto para gráficos com eixo. Em tela estreita cai sozinho para 2 e depois 1.',
    block: {
      id: 'grid_tres_colunas',
      type: 'grid',
      span: FULL,
      props: {},
      blocks: [
        { id: 'tres_colunas_a', type: 'bar_chart', span: FULL },
        { id: 'tres_colunas_b', type: 'donut', span: FULL },
        { id: 'tres_colunas_c', type: 'bar_list', span: FULL },
      ],
    },
  },

  /* ---------------------------------------------------------------------- *
   * KPIs + GRÁFICOS — a composição de dashboard mais comum
   * ---------------------------------------------------------------------- */
  kpis_e_graficos: {
    id: 'kpis_e_graficos',
    name: 'Linha de KPIs + linha de gráficos',
    when: 'Abertura de dashboard: os números do período em cima, o detalhamento embaixo. DOIS grids irmãos, e não um só — é o que dá à faixa de KPIs a altura compacta e à de gráficos a altura cheia.',
    block: {
      id: 'grid_kpis_e_graficos',
      type: 'grid',
      span: FULL,
      // Uma coluna de grids: cada filho é uma FAIXA da composição.
      props: { columns: 1, gap: 'lg' },
      blocks: [
        {
          id: 'faixa_kpis',
          type: 'grid',
          span: FULL,
          blocks: [
            { id: 'kpi_arrecadado', type: 'kpi', span: FULL },
            { id: 'kpi_inadimplencia', type: 'kpi', span: FULL },
            { id: 'kpi_parcelamentos', type: 'kpi', span: FULL },
            { id: 'kpi_ticket', type: 'kpi', span: FULL },
          ],
        },
        {
          id: 'faixa_graficos',
          type: 'grid',
          span: FULL,
          props: { columns: 2 },
          blocks: [
            { id: 'grafico_evolucao', type: 'line_chart', span: FULL },
            { id: 'grafico_composicao', type: 'donut', span: FULL },
          ],
        },
      ],
    },
  },
};

/** Todas as receitas, na ordem de complexidade crescente. */
export const LAYOUT_RECIPES = RECIPES;

/** Lista as receitas (ordem estável: a de declaração). */
export function listLayoutRecipes(): LayoutRecipe[] {
  return Object.values(RECIPES);
}

/** Uma receita pelo id. */
export function layoutRecipe(id: LayoutRecipeId): LayoutRecipe {
  return RECIPES[id];
}
