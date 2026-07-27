/**
 * Bloco `resizable_panels` — CONTAINER de layout em painéis arrastáveis.
 *
 * O `BlockRenderer` injeta `childBlocks` (sub-blocos crus) + `renderChild`.
 * Cada filho vira uma ZONA do `Layout` do Astryx: os N-1 primeiros são painéis
 * de tamanho arrastável (`PanelSlot` = `LayoutPanel`/`LayoutHeader` +
 * `ResizeHandle`) e o último ocupa o conteúdo, absorvendo o espaço que sobra.
 *
 * `direction` escolhe o eixo do split (horizontal = lado a lado, na zona
 * `start`; vertical = empilhado, na zona `header`) e `defaultSizes` o tamanho
 * inicial de cada painel.
 *
 * Sem filhos (galeria do catálogo), mostra o placeholder com dois painéis.
 */
import type { Block } from '@dashboards/contracts';
import { Card } from '@astryxdesign/core/Card';
import { Layout, LayoutContent } from '@astryxdesign/core/Layout';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';
import { PanelSlot, type PanelDirection } from './panel-slot';
import { PANELS_MIN_HEIGHT, ResizablePlaceholder } from './placeholder';

type ResizableProps = {
  direction?: PanelDirection;
  defaultSizes?: number[];
};

/**
 * Tamanho inicial de cada painel arrastável. Usa `defaultSizes` quando o
 * tamanho do array casa com o número de filhos; caso contrário divide igual.
 * No eixo horizontal a porcentagem é relativa à largura disponível; no
 * vertical vira px sobre a altura mínima do bloco (não há "% da altura" antes
 * de medir o container).
 */
function resolveSizes(
  count: number,
  direction: PanelDirection,
  defaultSizes?: number[],
): (number | string)[] {
  const percents =
    defaultSizes && defaultSizes.length === count
      ? defaultSizes
      : Array.from({ length: count }, () => 100 / count);
  return percents.map((pct) =>
    direction === 'horizontal' ? `${pct}%` : Math.round((pct / 100) * PANELS_MIN_HEIGHT),
  );
}

export const Component: BlockComponent<ResizableProps> = ({
  props,
  childBlocks,
  renderChild,
}) => {
  const direction: PanelDirection = props.direction ?? 'horizontal';

  // Sem filhos → placeholder ilustrativo (catálogo/galeria).
  if (!childBlocks?.length || !renderChild) {
    return <ResizablePlaceholder direction={direction} />;
  }

  const children = childBlocks as Block[];
  const sizes = resolveSizes(children.length, direction, props.defaultSizes);
  const last = children[children.length - 1];
  const panels = children.slice(0, -1).map((child, i) => (
    <PanelSlot
      key={child.id}
      direction={direction}
      defaultSize={sizes[i]}
      label={`Redimensionar painel ${i + 1}`}
    >
      {renderChild(child)}
    </PanelSlot>
  ));
  const isHorizontal = direction === 'horizontal';

  return (
    <Card
      padding={0}
      minHeight={PANELS_MIN_HEIGHT}
      data-slot="resizable-panels"
      data-resizable-direction={direction}
    >
      <Layout
        height="fill"
        start={isHorizontal ? panels : undefined}
        header={isHorizontal ? undefined : panels}
        content={<LayoutContent padding={2}>{renderChild(last)}</LayoutContent>}
      />
    </Card>
  );
};

export const definition = defineBlock<ResizableProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
