/**
 * UM bloco dentro do canvas do editor: o bloco REAL (o mesmo `BlockRenderer` da
 * tela publicada) embrulhado numa casca de edição — selecionável no clique, com
 * as ações de posição aparecendo no topo direito.
 *
 * O bloco desenhado aqui é o mesmo objeto que o consumidor verá. Essa é a razão
 * de ser do canvas: no editor antigo, o que se editava era um FORMULÁRIO com o
 * id do bloco, e o resultado morava numa coluna à parte — o usuário fazia a
 * tradução entre os dois na cabeça. Aqui a coisa e o controle da coisa são o
 * mesmo elemento na tela.
 *
 * CLIQUE vs. BOTÕES: o clique no card seleciona, mas os botões da barra de
 * ações (e qualquer coisa interativa dentro do gráfico) continuam funcionando —
 * quem resolve essa distinção é o `useClickableContainer` do design system, que
 * existe exatamente para o problema de "container clicável com interativos
 * dentro". Sem ele, ou o card não seria clicável, ou os botões dentro dele
 * disparariam a seleção junto.
 *
 * ACESSIBILIDADE: o card em si não é um `button` (ele contém botões, tabelas e
 * gráficos — aninhar seria HTML inválido e um alvo de teclado gigante). O
 * caminho por teclado é a barra de ações, que tem um botão "Editar" explícito
 * como primeiro item e fica visível ao receber foco.
 */
import { useRef } from 'react';
import type { Block, DashboardDataPayload } from '@dashboards/contracts';
import { useClickableContainer } from '@astryxdesign/core/hooks';
import { BlockRenderer } from '@/shared/render-engine';
import { BlockActions, type BlockActionsProps } from './block-actions';

export interface CanvasBlockProps extends Omit<BlockActionsProps, 'blockLabel'> {
  block: Block;
  /** Rótulo humano do bloco (título do card ou id) — compõe o nome das ações. */
  label: string;
  data: DashboardDataPayload | undefined;
  isSelected: boolean;
  /** `false` no modo somente leitura (pré-visualização da versão publicada). */
  isEditable: boolean;
  onSelect: () => void;
}

export function CanvasBlock({
  block,
  label,
  data,
  isSelected,
  isEditable,
  onSelect,
  ...actions
}: CanvasBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { onClick, onMouseUp } = useClickableContainer({
    containerRef,
    onClick: onSelect,
    disabled: !isEditable,
  });

  return (
    <div
      ref={containerRef}
      className="app-canvas-block"
      data-selected={isSelected ? 'true' : undefined}
      data-editable={isEditable ? 'true' : undefined}
      data-block-id={block.id}
      data-block-type={block.type}
      onClick={isEditable ? onClick : undefined}
      onMouseUp={isEditable ? onMouseUp : undefined}
    >
      <BlockRenderer block={block} data={data} result={data?.blocks?.[block.id]} framed />
      {isEditable ? (
        <div className="app-canvas-block__actions">
          <BlockActions blockLabel={label} onEdit={onSelect} {...actions} />
        </div>
      ) : null}
    </div>
  );
}
