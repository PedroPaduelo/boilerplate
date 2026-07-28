/**
 * Render-engine (catálogo VIVO / plug-and-play) — barril público.
 *
 * Consumido por T-G (tela de dashboard), preview e chat. Os blocos do catálogo
 * (T-I) NÃO importam daqui um índice central: eles apenas criam a pasta
 * `catalog/<type>/` e o registry os descobre via glob.
 */
export * from './types';
export { getBlock, listBlocks, hasBlock } from './registry';
export { BlockRenderer } from './block-renderer';
export type { BlockRendererProps } from './block-renderer';
export { DashboardRenderer } from './dashboard-renderer';
export type { DashboardRendererProps } from './dashboard-renderer';
export type { BlockFrameProps, BlockFrameTakeaway } from './block-frame';
export type { BlockBoundaryProps } from './block-boundary';
/**
 * Grade de blocos. Sai pelo barril porque as regras de composição — itens da
 * mesma linha do mesmo tamanho, altura de linha definida, colapso previsível —
 * valem para qualquer tela que disponha blocos, não só para o dashboard.
 */
export { BlockGrid } from './block-grid';
export type { BlockGridProps } from './block-grid';
export { BlockSurface } from './block-surface';
export type { BlockSurfaceProps } from './block-surface';
export { readGridOptions, resolveSurfaceVariant } from './lib/layout-options';
export type {
  BlockGridAlign,
  BlockGridGap,
  BlockGridOptions,
  BlockItemSizing,
  BlockSurfaceVariant,
} from './lib/layout-options';
/**
 * Política de formato e de tamanho dos blocos. Sai pelo barril porque quem
 * RENDERIZA um bloco fora do dashboard (o chat) precisa das mesmas decisões —
 * senão cada tela reinventa altura e unidade, que é como o card do chat acabou
 * com um KPI esticado por 1086 px e uma contagem escrita em reais.
 */
export {
  CATALOG_VALUE_FORMAT_DEFAULT,
  describeValueFormat,
  formatCatalogValue,
  isCurrencyFormat,
  resolveValueFormat,
} from './lib/value-format';
export {
  BLOCK_COLUMN_MIN_WIDTH,
  BLOCK_MAX_COLUMNS,
  BLOCK_ROW_HEIGHT,
  CHART_BODY_HEIGHT,
  COMPACT_CARD_MAX_COLUMNS,
  COMPACT_CARD_MIN_WIDTH,
  chartBodyHeight,
  columnPolicyFor,
  isCompactCardBlock,
  rowHeightForType,
  rowHeightForTypes,
  rowHeightPx,
} from './lib/block-sizing';
export type { BlockRowHeight, ChartBodySize } from './lib/block-sizing';
/**
 * Receitas de composição — os layouts prontos que o agente reusa (1, 2 e 3
 * colunas; KPIs + gráficos). Ficam em código, e não só na documentação, porque
 * o que está em código é testado.
 */
export { LAYOUT_RECIPES, listLayoutRecipes, layoutRecipe } from './lib/layout-recipes';
export type { LayoutRecipe, LayoutRecipeId } from './lib/layout-recipes';
export { describeDataScope } from './lib/data-caption';
