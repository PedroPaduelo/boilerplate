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
  CHART_BODY_HEIGHT,
  COMPACT_CARD_MAX_COLUMNS,
  COMPACT_CARD_MIN_WIDTH,
  chartBodyHeight,
  isCompactCardBlock,
} from './lib/block-sizing';
export { describeDataScope } from './lib/data-caption';
