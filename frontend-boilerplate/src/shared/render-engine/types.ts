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
  Block,
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
   * Altura do CORPO do desenho, em px, quando o autor DECLAROU uma altura para
   * a linha/bloco (`row.height`/`block.height`). `undefined` = ninguém declarou,
   * e o bloco usa a altura fixa do seu tipo (o padrão de sempre).
   *
   * Só os gráficos com eixo (série/dispersão) a consomem — repassando-a ao
   * `height` do gráfico de `@/shared/ui` —, que é o que faz o desenho REALMENTE
   * crescer/encolher com o controle de altura do editor, em vez de só reservar
   * espaço vazio na célula. Blocos quadrados (rosca, medidor) e cartões
   * compactos ignoram: esticá-los distorceria o desenho.
   */
  bodyHeight?: number;
  /**
   * Sub-blocos JÁ renderizados (grade de filhos), injetados pelo BlockRenderer
   * em blocos-CONTAINER (`grid`, `section`, …). O componente container só
   * desenha seu "shell" (cabeçalho, superfície, disclosure) e coloca `children`
   * no corpo. `undefined` em blocos folha.
   *
   * Use `children` quando o container quiser a GRADE PADRÃO — que é o caminho
   * normal e o recomendado (`grid`, `section`, `collapsible_block`, `sheet`):
   * ela já vem montada com as opções declaradas nas props do próprio container
   * (`readGridOptions`) e com as garantias de composição do motor (itens da
   * mesma linha do mesmo tamanho, altura de linha definida, colapso previsível).
   */
  children?: ReactNode;
  /**
   * Sub-blocos CRUS (não renderizados) — id/type/span/rowSpan/dataBinding.
   * Injetado junto com `children` em containers. É a válvula de escape para um
   * container que precise CONTROLAR a disposição dos filhos em vez de usar a
   * grade padrão; nenhum bloco do catálogo precisa dela hoje, e quem for usá-la
   * abre mão das garantias de composição do motor (tamanho igual na linha,
   * altura de linha, colapso). Cada filho é renderizado com `renderChild(block)`.
   * `undefined` em blocos folha.
   */
  childBlocks?: Block[];
  /**
   * Renderiza UM sub-bloco (com a moldura/estado certos). Usado pelos
   * containers que dispõem os filhos manualmente (com `childBlocks`).
   * `undefined` em blocos folha.
   *
   * O 2º parâmetro (`declaredHeight`) é a altura de célula declarada do filho,
   * repassada pelo `BlockGrid`; containers que usam a grade padrão nem precisam
   * conhecê-lo — o próprio grid o injeta.
   */
  renderChild?: (block: Block, declaredHeight?: number) => ReactNode;
}

/** Assinatura de um componente de bloco. */
export type BlockComponent<P = Record<string, unknown>, D = BlockData> = ComponentType<
  BlockComponentProps<P, D>
>;

/**
 * Retorno de `BlockDefinition.deriveTakeaway`. Cada string vira uma linha
 * de insight no rodapé da moldura (`BlockFrame`). `string` (legado, 1 item)
 * ainda é aceito por retrocompat — o `BlockRenderer` normaliza antes de
 * passar para a moldura.
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
   * rodapé da moldura (`BlockFrame`).
   *
   * Recebe também as PROPS já mescladas porque o insight repete números que o
   * bloco desenhou, e um número precisa da mesma unidade nos dois lugares: o
   * takeaway que formatava moeda por conta própria dizia "Maior: order.paid
   * (R$ 11,19 mil)" embaixo de um gráfico que já mostrava contagem. Quem só
   * precisa dos dados simplesmente ignora o segundo parâmetro.
   *
   * `props` é OPCIONAL de propósito: há chamadores que derivam o insight fora
   * do render, sem um bloco montado (o editor de takeaways do playground).
   * Quem implementa deve assumir um default — e o default de formato já é o
   * neutro (`lib/value-format.ts`), então cair aqui sem props não reintroduz
   * moeda.
   *
   * Retorne:
   *  - `undefined` / vazio → nenhum insight renderizado;
   *  - `string` → 1 linha (retrocompat com a versão 1 linha);
   *  - `string[]` → 1 linha por string (padrão atual — cada string já
   *    vira 1 item `{ enabled: true, text }` no ChartWidget).
   *
   * Mantém o cálculo do insight no PRÓPRIO bloco (padrão escalável p/ todo
   * o catálogo, opt-in).
   */
  deriveTakeaway?: (data: D, props?: P) => TakeawayResult;
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
