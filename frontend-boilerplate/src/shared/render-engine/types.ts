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
   *
   * Use `children` quando o container só quer o GRID PADRÃO (12 colunas) — é
   * o caminho simples e retrocompatível (ex.: `section`, `dashboard_panel`).
   */
  children?: ReactNode;
  /**
   * Sub-blocos CRUS (não renderizados) — id/type/span/rowSpan/dataBinding.
   * Injetado junto com `children` em containers. Use quando o container quer
   * CONTROLAR a disposição dos filhos (bento mosaico, painéis arrastáveis,
   * cards que expandem) em vez do grid padrão. Cada filho é renderizado com
   * `renderChild(block)`. `undefined` em blocos folha.
   */
  childBlocks?: Block[];
  /**
   * Renderiza UM sub-bloco (com a moldura/estado certos). Usado pelos
   * containers que dispõem os filhos manualmente (com `childBlocks`).
   * `undefined` em blocos folha.
   */
  renderChild?: (block: Block) => ReactNode;
}

/** Assinatura de um componente de bloco. */
export type BlockComponent<P = Record<string, unknown>, D = BlockData> = ComponentType<
  BlockComponentProps<P, D>
>;

/**
 * Retorno de `BlockDefinition.deriveTakeaway`. Cada string vira uma linha
 * de insight no rodapé do `ChartWidget`. `string` (legado, 1 item) ainda é
 * aceito por retrocompat — `BlockRenderer` normaliza p/ `string[]` antes de
 * passar pro ChartWidget.
 */
export type TakeawayResult = string | string[] | undefined;

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
   * (Opcional) Deriva 0..N frases curtas de INSIGHT de negócio ("takeaway")
   * a partir dos dados já resolvidos no shape do bloco — exibidas no
   * rodapé do `ChartWidget`. Retorne:
   *  - `undefined` / vazio → nenhum insight renderizado;
   *  - `string` → 1 linha (retrocompat com a versão 1 linha);
   *  - `string[]` → 1 linha por string (padrão atual — cada string já
   *    vira 1 item `{ enabled: true, text }` no ChartWidget).
   *
   * Mantém o cálculo do insight no PRÓPRIO bloco (padrão escalável p/ todo
   * o catálogo, opt-in).
   */
  deriveTakeaway?: (data: D) => TakeawayResult;
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