/**
 * Placeholder sem filhos (galeria do catálogo) — dois painéis e a divisória
 * arrastável entre eles, para comunicar o conceito.
 *
 * Reusa o `PanelSlot` real: o que se vê na galeria é o mesmo mecanismo do
 * bloco com filhos, e não uma imitação estática.
 */
import { Card } from '@astryxdesign/core/Card';
import { Center } from '@astryxdesign/core/Center';
import { Layout, LayoutContent } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { PanelSlot, type PanelDirection } from './panel-slot';

/** Altura mínima do bloco — sem ela não há o que arrastar. */
export const PANELS_MIN_HEIGHT = 320;

function PanelLabel({ children }: { children: string }) {
  return (
    <Center height="100%">
      <Text type="supporting" color="secondary">
        {children}
      </Text>
    </Center>
  );
}

export function ResizablePlaceholder({ direction }: { direction: PanelDirection }) {
  const isHorizontal = direction === 'horizontal';
  const first = (
    <PanelSlot
      direction={direction}
      defaultSize={isHorizontal ? '50%' : PANELS_MIN_HEIGHT / 2}
      label="Redimensionar painel A"
    >
      <PanelLabel>Painel A</PanelLabel>
    </PanelSlot>
  );

  return (
    <Card
      padding={0}
      minHeight={PANELS_MIN_HEIGHT}
      data-slot="resizable-panels-placeholder"
    >
      <Layout
        height="fill"
        start={isHorizontal ? first : undefined}
        header={isHorizontal ? undefined : first}
        content={
          <LayoutContent padding={2}>
            <PanelLabel>Painel B</PanelLabel>
          </LayoutContent>
        }
      />
    </Card>
  );
}
