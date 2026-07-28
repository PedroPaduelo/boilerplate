/**
 * Superfície pública do playground de blocos.
 *
 * Quem consome (o dialog do catálogo e a tela `/charts/:id`) importa daqui —
 * os painéis e hooks internos ficam privados ao diretório.
 */
export { BlockPlayground } from './block-playground';
export type { BlockPlaygroundProps } from './block-playground';
export type {
  LiveData,
  PlaygroundConfig,
  PlaygroundSeed,
  PlaygroundSnapshot,
  PlaygroundState,
  Takeaway,
} from './types';
