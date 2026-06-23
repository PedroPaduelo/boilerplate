/**
 * Render-engine — INTERFACE de um bloco do catálogo (F0.4).
 *
 * Todo bloco do catálogo implementa `BlockDefinition` e o exporta como
 * `definition` em `catalog/<type>/component.tsx`. A "forma" se alinha ao
 * BlockManifest neutro de `@dashboards/contracts` (fonte da verdade dos
 * contratos — NÃO duplicamos schema aqui).
 *
 * Doc 03 (catálogo + motor de render), doc 33 (anatomia do bloco) e doc 20
 * (contrato LAYOUT × DADOS × BLOCO).
 */
import type { ComponentType, ReactNode } from 'react';
import type {
  BlockManifest,
  ScalarData,
  SeriesData,
  CategoricalData,
  TableData,
} from '@dashboards/contracts';

/** Dado já transformado para o shape do bloco (conforme dataContract.shape). */
export type BlockData = ScalarData | SeriesData | CategoricalData | TableData;

/** Estados de render de um bloco (doc 03 / doc 32 §4). */
export type BlockRenderState = 'skeleton' | 'loading' | 'success' | 'error' | 'empty';

/** Props que o BlockRenderer injeta em TODO componente de bloco. */
export interface BlockComponentProps<P = Record<string, unknown>, D = BlockData> {
  /** Props visuais já mescladas (manifest.defaultProps + block.props). */
  props: P;
  /** Dados resolvidos no shape do bloco. `undefined` p/ narrativos ou enquanto carrega. */
  data?: D;
  /** Estado atual do bloco. */
  state: BlockRenderState;
  /** Mensagem de erro (quando state === 'error'). */
  error?: string;
  /**
   * Sub-blocos JÁ renderizados (grid de filhos), injetados pelo BlockRenderer
   * em blocos-CONTAINER (ex.: `section`, `bento`). O componente container só
   * desenha seu "shell" (header + moldura) e coloca `children` no corpo.
   * `undefined` em blocos folha.
   */
  children?: ReactNode;
}

/** Assinatura de um componente de bloco. */
export type BlockComponent<P = Record<string, unknown>, D = BlockData> = ComponentType<
  BlockComponentProps<P, D>
>;

/**
 * Contrato que TODO bloco do catálogo implementa.
 * Exportado como `definition` (e `default`) em `catalog/<type>/component.tsx`.
 */
export interface BlockDefinition<P = Record<string, unknown>, D = BlockData> {
  /** catalogType — DEVE ser igual a `manifest.type` e ao nome da pasta. */
  type: string;
  /** Manifesto neutro (o MESMO objeto coletado por `build:catalog` no BE/IA). */
  manifest: BlockManifest;
  /** Componente React que renderiza o bloco. */
  Component: BlockComponent<P, D>;
  /** Dado de exemplo que casa com o `dataContract` (preview/dev/testes). */
  fixture?: D | null;
  /**
   * (Opcional) Deriva uma frase curta de INSIGHT de negócio ("takeaway") a
   * partir dos dados já resolvidos no shape do bloco — exibida no rodapé do
   * `ChartWidget`. Retorne `undefined` para não exibir nada. Mantém o cálculo
   * do insight no PRÓPRIO bloco (padrão escalável p/ todo o catálogo, opt-in).
   */
  deriveTakeaway?: (data: D) => string | undefined;
}

/**
 * Helper de autoria (infere os genéricos e valida o shape em tempo de
 * compilação). Uso: `export const definition = defineBlock({ ... })`.
 */
export function defineBlock<P = Record<string, unknown>, D = BlockData>(
  def: BlockDefinition<P, D>,
): BlockDefinition<P, D> {
  return def;
}
