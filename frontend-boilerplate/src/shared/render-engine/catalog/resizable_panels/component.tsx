/**
 * Bloco `resizable_panels` — CONTAINER de layout em painéis arrastáveis.
 *
 * Usa o mecanismo de container do render-engine: o `BlockRenderer` injeta
 * `childBlocks` (sub-blocos crus) + `renderChild` (renderiza 1 filho). Este
 * componente transforma CADA filho num PAINEL do `ResizablePanelGroup`
 * (shadcn/react-resizable-panels), com uma divisória (handle) arrastável
 * entre eles. Assim a IA monta `block.blocks` com a MESMA sintaxe do
 * dashboard/section, e o bloco vira um split redimensionável (2+ painéis).
 *
 * `direction` controla o eixo do split (horizontal = lado a lado; vertical =
 * empilhado) e `defaultSizes` o tamanho inicial (%) de cada painel.
 *
 * Sem filhos (galeria do catálogo), mostra um placeholder ilustrativo com
 * dois painéis e a divisória para comunicar o conceito.
 */
import type { ReactNode } from 'react';
import type { Block } from '@dashboards/contracts';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type Direction = 'horizontal' | 'vertical';
type ResizableProps = {
  direction?: Direction;
  defaultSizes?: number[];
};

/**
 * Calcula o tamanho inicial (%) de cada painel. Usa `defaultSizes` quando o
 * tamanho do array casa com o número de filhos; caso contrário divide igual.
 */
function resolveSizes(count: number, defaultSizes?: number[]): number[] {
  if (defaultSizes && defaultSizes.length === count) return defaultSizes;
  return Array.from({ length: count }, () => 100 / count);
}

export const Component: BlockComponent<ResizableProps> = ({
  props,
  childBlocks,
  renderChild,
}) => {
  const direction: Direction = props.direction ?? 'horizontal';

  // Sem filhos → placeholder ilustrativo (catálogo/galeria).
  if (!childBlocks?.length || !renderChild) {
    return <ResizablePlaceholder direction={direction} />;
  }

  const children = childBlocks as Block[];
  const sizes = resolveSizes(children.length, props.defaultSizes);

  return (
    <div className="min-h-[20rem] w-full overflow-hidden rounded-lg border border-border">
      <ResizablePanelGroup direction={direction}>
        {children.map((child, i) => (
          <ResizablePanelGroupItem
            key={child.id}
            isLast={i === children.length - 1}
            defaultSize={sizes[i]}
          >
            <div className="h-full min-w-0 overflow-auto p-2">
              {renderChild(child)}
            </div>
          </ResizablePanelGroupItem>
        ))}
      </ResizablePanelGroup>
    </div>
  );
};

/** Um painel + a divisória que o separa do próximo (omitida no último). */
function ResizablePanelGroupItem({
  children,
  defaultSize,
  isLast,
}: {
  children: ReactNode;
  defaultSize: number;
  isLast: boolean;
}) {
  return (
    <>
      <ResizablePanel defaultSize={defaultSize}>{children}</ResizablePanel>
      {!isLast && <ResizableHandle withHandle />}
    </>
  );
}

/** Placeholder (sem filhos) — comunica o conceito na galeria. */
function ResizablePlaceholder({ direction }: { direction: Direction }) {
  return (
    <div
      data-slot="resizable-panels-placeholder"
      className="min-h-[20rem] w-full overflow-hidden rounded-lg border border-border"
    >
      <ResizablePanelGroup direction={direction}>
        <ResizablePanel defaultSize={50}>
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 text-xs text-muted-foreground">
            Painel A
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50}>
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/5 to-transparent p-4 text-xs text-muted-foreground">
            Painel B
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export const definition = defineBlock<ResizableProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
