/**
 * BlockGrid — o GRID em que todo bloco é posicionado. É aqui que moram as
 * quatro regras de composição do motor:
 *
 *  1. MESMA LINHA, MESMO TAMANHO. Por padrão (`itemSizing: 'equal'`) as colunas
 *     são faixas iguais (`1fr`) e cada bloco ocupa exatamente UMA. O `span`
 *     deixa de decidir largura — antes, um layout com `span: 7` e `span: 5`
 *     colocava dois gráficos irmãos em 58% e 42% da linha, desiguais por
 *     acidente de escrita. A única leitura de `span` que sobrou é a inequívoca:
 *     `span >= 12` significa "linha inteira" (`grid-column: 1 / -1`).
 *
 *  2. ALTURA DEFINIDA POR LINHA. A linha adota UM degrau de altura — o da
 *     família mais alta que ela contém (`rowHeightForTypes`) — e o aplica como
 *     PISO na célula. Com `align="stretch"` (padrão do CSS Grid) todas as
 *     células da faixa terminam com a mesma altura, e ela é previsível: uma
 *     linha só de KPIs é baixa, uma linha de séries é alta, uma linha de texto
 *     não reserva altura nenhuma.
 *
 *     A derivação é o PADRÃO, não uma prisão: `rowHeight` (degrau ou pixels)
 *     e `block.height` deixam o autor decidir. A ordem é a da especificidade —
 *     bloco, linha, derivação —, então "esta linha é alta, mas aquele bloco
 *     dela é baixo" continua sendo uma frase que o layout sabe dizer.
 *
 *  3. COLAPSO PREVISÍVEL. O número de colunas é declarado como
 *     `{minWidth, max}`: o grid encaixa quantas faixas de `minWidth` couberem,
 *     até o teto. Em tela estreita ele cai sozinho de 3 → 2 → 1 e a última
 *     coluna estica para 100%. Sem media query e sem breakpoint escrito à mão.
 *
 *  4. MOSAICO É OPT-IN. Quem quer destaque assimétrico pede
 *     `itemSizing: 'span'` — aí valem `span` (1..12) e `rowSpan`, no grid de 12
 *     colunas de sempre. Quebrar a regra 1 é possível, mas só de propósito.
 *
 * Quem traduz isso para CSS é o `Grid`/`GridSpan` do design system: o motor
 * descreve a INTENÇÃO ("três faixas iguais de no mínimo 280px"), não a regra de
 * grid — por isso aqui não há `gridTemplateColumns` montado na mão.
 */
import type { CSSProperties, ReactNode } from 'react';
import type { Block } from '@dashboards/contracts';
import { Grid, GridSpan } from '@astryxdesign/core/Grid';
import type { GridColumns } from '@astryxdesign/core/Grid';
import {
  columnPolicyFor,
  declaredHeightPx,
  hasDeclaredHeight,
  isBlockRowHeight,
  rowHeightForType,
  rowHeightForTypes,
  rowHeightPx,
  type BlockHeight,
  type BlockRowHeight,
} from './lib/block-sizing';
import { GAP_STEP, SPAN_COLUMNS, type BlockGridOptions } from './lib/layout-options';

export interface BlockGridProps extends BlockGridOptions {
  blocks: Block[];
  /**
   * Renderiza UM bloco (com a moldura/estado certos).
   *
   * `declaredHeight` é a altura de CÉLULA que o AUTOR declarou para este bloco
   * (px), ou `undefined` quando ninguém declarou nada e a altura sai da
   * derivação por tipo. Ela é repassada para que a moldura/gráfico REALMENTE
   * assumam o tamanho pedido — sem isso a altura só esticava a célula e o
   * desenho continuava do tamanho fixo do tipo.
   */
  renderBlock: (block: Block, declaredHeight?: number) => ReactNode;
  /** `data-slot` do container — usado para inspeção do DOM. */
  slot: string;
  /** `data-slot` de cada célula. */
  cellSlot: string;
}

/**
 * Filho com os campos OPCIONAIS de tamanho do contrato: `rowSpan` (linhas do
 * mosaico, default 1) e `height` (altura declarada, que vence a derivada do
 * tipo — ver `block-sizing`).
 */
type SpannedBlock = Block & { rowSpan?: number; height?: BlockHeight };

/**
 * A célula manda na altura do que está dentro dela.
 *
 * `GridSpan` já é `display:grid; height:100%`, então o bloco (uma `<div>`
 * comum) recebe a altura da faixa. Mas o CARD dentro do bloco não: ele para de
 * crescer na altura do próprio conteúdo, e dois gráficos vizinhos terminam com
 * cards de alturas diferentes dentro de células iguais — a mesma queixa de "um
 * maior que o outro", um nível abaixo. O seletor alcança o filho do bloco (o
 * `Card` da moldura, o `Banner` de erro, o cartão do KPI) sem que o motor
 * precise conhecer nenhum deles pelo nome.
 *
 * É utility com valor relativo (100%), não medida: não há número de design
 * aqui para sair de token.
 */
const CELL_FILL_CLASS = '[&>*]:h-full [&>*>*]:h-full';

/** O bloco pediu a linha inteira? (`span >= 12`, ou `span` ausente.) */
function isFullWidth(block: Block): boolean {
  return (block.span ?? SPAN_COLUMNS) >= SPAN_COLUMNS;
}

/**
 * Configuração de colunas do `Grid` no modo `equal`.
 *
 * `{minWidth, max}` (e não um número fixo) é o que dá o colapso responsivo de
 * graça: `max` limita o teto em tela larga e o `auto-fill` reduz as faixas
 * sozinho quando não cabem — a coluna que sobra estica para 100%.
 */
function equalColumns(
  itemCount: number,
  step: BlockRowHeight,
  override?: number,
): GridColumns {
  const policy = columnPolicyFor(step);
  // `columns` explícito manda (o autor pediu um número de faixas); sem ele, a
  // quantidade de itens, limitada pelo teto da família.
  const count = override ?? Math.min(itemCount, policy.maxColumns);
  return { minWidth: policy.minWidth, max: Math.max(1, count) };
}

export function BlockGrid({
  blocks,
  renderBlock,
  slot,
  cellSlot,
  columns,
  gap = 'md',
  align = 'stretch',
  rowHeight,
  itemSizing = 'equal',
}: BlockGridProps) {
  const isSpanMode = itemSizing === 'span';

  // Os blocos de linha inteira não entram na conta das faixas: eles ocupam
  // `1 / -1` e não competem por coluna com os demais.
  const trackItems = isSpanMode ? blocks : blocks.filter((block) => !isFullWidth(block));

  // Degrau da LINHA: o explícito do autor ou, na ausência dele, o que os tipos
  // dos blocos QUE DIVIDEM A LINHA exigem. `undefined` = "não escreva altura"
  // (linha narrativa), e é diferente de zero.
  //
  // `rowHeight` aceita px (o autor mediu na tela e decidiu). Nesse caso não há
  // "degrau" a anunciar: o atributo de inspeção reporta `custom`, e os pixels
  // vão direto para a célula.
  const declaredRowPx =
    typeof rowHeight === 'number' ? declaredHeightPx(rowHeight) : undefined;
  const step = isBlockRowHeight(rowHeight)
    ? rowHeight
    : rowHeightForTypes(trackItems.map((block) => block.type));

  const gridColumns: GridColumns = isSpanMode
    ? SPAN_COLUMNS
    : equalColumns(trackItems.length, step, columns);

  // Uma grade de coluna única não tem "vizinho de linha": cada bloco está
  // sozinho na sua faixa, então uniformizar daria 460px a um título que só
  // precisa da altura do texto.
  const isSingleColumn = columns === 1;

  /**
   * Degrau DESTA célula.
   *
   * O degrau é da linha — mas só faz sentido para quem DIVIDE a linha. Quem
   * está sozinho na sua faixa (bloco de largura total, ou qualquer bloco numa
   * grade de coluna única) usa o degrau do próprio tipo: era assim que um
   * título full-width acima de dois gráficos herdava os 460px da série.
   *
   * O `rowHeight` explícito escapa das duas regras e vale para todas as
   * células — ali o autor pediu uniformidade de propósito.
   */
  function cellStep(block: Block): BlockRowHeight {
    if (isBlockRowHeight(rowHeight)) return rowHeight;
    if (isSingleColumn || isFullWidth(block)) return rowHeightForType(block.type);
    return step;
  }

  /**
   * Altura FINAL da célula, em px, na ordem de quem decide:
   *
   *   1. o BLOCO, se declarou altura própria (exceção pontual);
   *   2. a LINHA, se declarou (o caminho normal do editor);
   *   3. a derivação por tipo (o que sempre houve).
   *
   * A ordem é a da especificidade — do mais local para o mais geral —, e é o
   * que permite "esta linha é alta, mas aquele bloco dela é baixo" sem que a
   * regra vire uma exceção escondida no meio do render.
   */
  function cellHeight(block: SpannedBlock): number | undefined {
    if (hasDeclaredHeight(block.height)) return declaredHeightPx(block.height);
    if (declaredRowPx != null) return declaredRowPx;
    return rowHeightPx(cellStep(block));
  }

  /**
   * Altura que o AUTOR DECLAROU para esta célula, em px — ou `undefined` quando
   * nada foi declarado (aí quem manda é a derivação por tipo, lá embaixo, e o
   * desenho não deve ser forçado a tamanho nenhum).
   *
   * É o subconjunto de `cellHeight` que veio de uma DECISÃO (bloco, senão
   * linha), sem o fallback derivado: só o que foi declarado tem o direito de
   * sobrepor o tamanho natural do gráfico. A ordem (bloco > linha) é a mesma da
   * especificidade que já vale para a altura da célula.
   */
  function declaredCellHeight(block: SpannedBlock): number | undefined {
    if (hasDeclaredHeight(block.height)) return declaredHeightPx(block.height);
    if (hasDeclaredHeight(rowHeight)) return declaredHeightPx(rowHeight);
    return undefined;
  }

  return (
    <Grid
      columns={gridColumns}
      gap={GAP_STEP[gap] ?? GAP_STEP.md}
      align={align}
      data-slot={slot}
      data-block-grid-sizing={itemSizing}
      data-block-grid-row-height={declaredRowPx != null ? 'custom' : step}
    >
      {blocks.map((block) => (
        <BlockCell
          key={block.id}
          block={block}
          slot={cellSlot}
          isSpanMode={isSpanMode}
          minHeight={cellHeight(block)}
        >
          {renderBlock(block, declaredCellHeight(block))}
        </BlockCell>
      ))}
    </Grid>
  );
}

interface BlockCellProps {
  block: SpannedBlock;
  slot: string;
  isSpanMode: boolean;
  /** Piso de altura da faixa, em px. `undefined` em linha narrativa. */
  minHeight?: number;
  children: ReactNode;
}

/** Uma célula da grade: largura declarada em faixas, altura declarada em px. */
function BlockCell({ block, slot, isSpanMode, minHeight, children }: BlockCellProps) {
  // `minHeight` é o ÚNICO valor de runtime desta camada (sai da política de
  // `block-sizing`, que depende dos tipos presentes na linha) — os demais são
  // props do design system. Por isso vai em `style`, com esta justificativa,
  // conforme a regra 2.3 do catálogo.
  const style: CSSProperties | undefined =
    minHeight != null ? { minHeight: `${minHeight}px` } : undefined;

  if (isSpanMode) {
    const rowSpan = block.rowSpan ?? 1;
    return (
      <GridSpan
        columns={Math.min(SPAN_COLUMNS, Math.max(1, block.span ?? SPAN_COLUMNS))}
        rows={rowSpan > 1 ? rowSpan : undefined}
        className={CELL_FILL_CLASS}
        style={style}
        data-slot={slot}
      >
        {children}
      </GridSpan>
    );
  }

  // Modo `equal`: uma faixa por bloco (largura idêntica), exceto quem pediu a
  // linha inteira. Nada de `rows` aqui — `rowSpan` é altura desigual, e altura
  // desigual é justamente o que este modo existe para impedir.
  return (
    <GridSpan
      columns={isFullWidth(block) ? 'full' : undefined}
      className={CELL_FILL_CLASS}
      style={style}
      data-slot={slot}
    >
      {children}
    </GridSpan>
  );
}
