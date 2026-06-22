/**
 * Render-engine (catálogo VIVO / plug-and-play) — barril público.
 *
 * Consumido por T-G (tela de dashboard), preview e chat. Os blocos do catálogo
 * (T-I) NÃO importam daqui um índice central: eles apenas criam a pasta
 * `catalog/<type>/` e o registry os descobre via glob.
 */
export * from './types';
export {
  getBlock,
  listBlocks,
  listBlockTypes,
  hasBlock,
  buildRegistry,
} from './registry';
export { BlockRenderer } from './block-renderer';
export type { BlockRendererProps } from './block-renderer';
export { DashboardRenderer } from './dashboard-renderer';
export type { DashboardRendererProps } from './dashboard-renderer';
