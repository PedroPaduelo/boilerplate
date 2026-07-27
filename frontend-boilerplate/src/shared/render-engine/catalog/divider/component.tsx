/**
 * Bloco `divider` (layout) — o `Divider` do Astryx.
 *
 * Horizontal: a linha com rótulo central opcional (`label` é prop nativa do
 * DS — não existe mais um "filho de texto" a posicionar na mão).
 *
 * Vertical: o divisor precisa de altura para existir, e ela vem do RITMO da
 * página (padding dos rótulos na escala de espaçamento), nunca de uma altura
 * fixa — o `Divider` vertical se estica sozinho para acompanhar a linha.
 */
import { Divider } from '@astryxdesign/core/Divider';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type DividerProps = { label?: string; orientation?: 'horizontal' | 'vertical' };

/** Rótulo lateral da demonstração vertical ("antes" | "depois" do divisor). */
function SideLabel({ children }: { children: string }) {
  return (
    <VStack vAlign="center" paddingBlock={6}>
      <Text type="supporting" color="secondary">
        {children}
      </Text>
    </VStack>
  );
}

export const Component: BlockComponent<DividerProps> = ({ props }) => {
  if (props.orientation === 'vertical') {
    return (
      <HStack
        gap={4}
        hAlign="center"
        align="stretch"
        paddingInline={2}
        data-slot="divider"
        data-divider-orientation="vertical"
      >
        <SideLabel>Antes</SideLabel>
        <Divider orientation="vertical" />
        <SideLabel>Depois</SideLabel>
      </HStack>
    );
  }

  return (
    <VStack
      paddingBlock={6}
      paddingInline={2}
      data-slot="divider"
      data-divider-orientation="horizontal"
    >
      <Divider label={props.label ? props.label : undefined} />
    </VStack>
  );
};

export const definition = defineBlock<DividerProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
