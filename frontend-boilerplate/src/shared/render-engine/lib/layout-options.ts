/**
 * O VOCABULÁRIO DE COMPOSIÇÃO — os nomes que um bloco container usa para pedir
 * um arranjo, e como lê-los de um JSON gerado por IA.
 *
 * Mora em `lib/` (e não junto do `BlockGrid`) por dois motivos que apontam para
 * o mesmo lugar: é código PURO, sem React — e é o que `grid`, `section`,
 * `collapsible_block` e `sheet` precisam declarar igual. Ter um módulo só é o
 * que garante que "gap: lg" signifique a mesma coisa nos quatro; antes cada
 * container reinterpretava `columns`/`gap` do seu jeito e o catálogo terminou
 * com duas grades diferentes.
 *
 * REGRA DE LEITURA: valor fora do vocabulário é IGNORADO, não corrigido. As
 * props vêm de um layout gerado por IA, e um `gap: "enorme"` deve degradar para
 * o padrão em vez de derrubar o bloco.
 *
 * REGRA DE AUSÊNCIA: o que não veio não é preenchido aqui. `columns` e
 * `rowHeight` ausentes significam "derive dos filhos" — se este módulo
 * inventasse um valor, a derivação nunca aconteceria e uma linha de títulos
 * ganharia a altura de um gráfico.
 */
import type { SpacingStep } from '@astryxdesign/core/Layout';
import {
  BLOCK_HEIGHT_PX_MAX,
  BLOCK_HEIGHT_PX_MIN,
  isBlockRowHeight,
  type BlockHeight,
} from './block-sizing';

/** Espaçamento entre células, na escala do design system. */
export type BlockGridGap = 'none' | 'sm' | 'md' | 'lg';

/** `gap` semântico → passo da escala de espaçamento do DS. */
export const GAP_STEP: Record<BlockGridGap, SpacingStep> = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 6,
};

/** Como a largura de cada item é decidida. */
export type BlockItemSizing = 'equal' | 'span';

/** Alinhamento vertical dos itens dentro da linha. */
export type BlockGridAlign = 'stretch' | 'start' | 'center' | 'end';

/** Superfície de um bloco container (card é escolha, não padrão). */
export type BlockSurfaceVariant = 'plain' | 'card' | 'framed';

/** Vocabulário de superfície aceito. */
const SURFACE_VARIANTS: readonly BlockSurfaceVariant[] = ['plain', 'card', 'framed'];

/**
 * Total de colunas do grid de `span` (contrato de LAYOUT: `span` é 1..12). É
 * também o teto de `columns` — pedir mais faixas do que o contrato admite não
 * é um arranjo, é um engano.
 */
export const SPAN_COLUMNS = 12;

/**
 * Opções de composição de um grid de blocos. São as MESMAS props que os blocos
 * container expõem no `propsSchema`.
 */
export interface BlockGridOptions {
  /**
   * Número de colunas. AUSENTE (o normal) significa "derive da quantidade de
   * itens, respeitando o teto da família" — é o que faz duas linhas com dois
   * gráficos ficarem iguais sem ninguém escrever `columns` em lugar nenhum.
   */
  columns?: number;
  /** Espaçamento entre células. Default `md`. */
  gap?: BlockGridGap;
  /** Alinhamento vertical. Default `stretch` (é o que iguala as alturas). */
  align?: BlockGridAlign;
  /**
   * Altura da linha: um DEGRAU nomeado ou um número em PIXELS. AUSENTE
   * significa "derive dos tipos dos filhos" — declarar um default de fábrica
   * aqui daria 460px a uma linha de títulos.
   */
  rowHeight?: BlockHeight;
  /** Largura dos itens: `equal` (default) ou `span` (mosaico). */
  itemSizing?: BlockItemSizing;
}

/** Lê as opções de grade das PROPS de um bloco container. */
export function readGridOptions(props: Record<string, unknown>): BlockGridOptions {
  const options: BlockGridOptions = {};

  if (typeof props.columns === 'number' && Number.isFinite(props.columns)) {
    options.columns = Math.max(1, Math.min(SPAN_COLUMNS, Math.round(props.columns)));
  }
  if (typeof props.gap === 'string' && props.gap in GAP_STEP) {
    options.gap = props.gap as BlockGridGap;
  }
  if (
    props.align === 'stretch' ||
    props.align === 'start' ||
    props.align === 'center' ||
    props.align === 'end'
  ) {
    options.align = props.align;
  }
  if (isBlockRowHeight(props.rowHeight)) {
    options.rowHeight = props.rowHeight;
  } else if (
    typeof props.rowHeight === 'number' &&
    Number.isFinite(props.rowHeight) &&
    props.rowHeight >= BLOCK_HEIGHT_PX_MIN &&
    props.rowHeight <= BLOCK_HEIGHT_PX_MAX
  ) {
    // Pixels só entram DENTRO da faixa: um `rowHeight: 3` não é altura, é um
    // engano de unidade (provavelmente "3 linhas"), e a regra de leitura do
    // módulo manda ignorar em vez de corrigir.
    options.rowHeight = Math.round(props.rowHeight);
  }
  if (props.itemSizing === 'equal' || props.itemSizing === 'span') {
    options.itemSizing = props.itemSizing;
  }

  return options;
}

/**
 * Normaliza a variante de superfície vinda das props do bloco. Valor fora do
 * vocabulário degrada para `plain` — que é justamente o padrão seguro: nenhuma
 * pintura.
 */
export function resolveSurfaceVariant(value: unknown): BlockSurfaceVariant {
  return SURFACE_VARIANTS.includes(value as BlockSurfaceVariant)
    ? (value as BlockSurfaceVariant)
    : 'plain';
}
