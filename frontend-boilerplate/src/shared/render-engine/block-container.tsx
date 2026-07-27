/**
 * Bloco CONTAINER — a metade "composição" do render-engine.
 *
 * Quando um bloco declara `block.blocks`, ele não desenha dado: desenha um
 * SHELL (header + moldura) e recebe os filhos como `children`. O sub-grid de 12
 * colunas é montado aqui e injetado; containers que dispõem os filhos à mão
 * (bento, resizable, expandable) recebem também `childBlocks` + `renderChild` e
 * ignoram o `children`.
 *
 * Mora separado do `BlockRenderer` para que ele fique com uma responsabilidade
 * só (resolver o tipo e escolher o caminho) — e para que a recursão apareça
 * como o que é: o container recebe a função de renderizar filho por parâmetro,
 * sem importar o renderer de volta (nada de import circular).
 */
import type { ReactNode } from 'react';
import type { Block } from '@dashboards/contracts';
import { BlockGrid } from './block-grid';
import type { BlockComponent } from './types';

export interface BlockContainerProps {
  block: Block;
  /** Componente do bloco, já resolvido pelo registry. */
  Component: BlockComponent;
  /** Props do manifesto mescladas com as do bloco. */
  props: Record<string, unknown>;
  /** Filhos declarados no layout. */
  childBlocks: Block[];
  /** Renderiza UM filho com a moldura/estado certos (recursão do renderer). */
  renderChild: (child: Block) => ReactNode;
  className?: string;
}

export function BlockContainer({
  block,
  Component,
  props,
  childBlocks,
  renderChild,
  className,
}: BlockContainerProps) {
  return (
    <div
      data-slot="block"
      data-block-type={block.type}
      data-block-state="success"
      data-block-container="true"
      className={className}
    >
      <Component
        props={props}
        state="success"
        data={undefined}
        childBlocks={childBlocks}
        renderChild={renderChild}
      >
        <BlockGrid
          blocks={childBlocks}
          renderBlock={renderChild}
          slot="block-children"
          cellSlot="block-child-cell"
        />
      </Component>
    </div>
  );
}
