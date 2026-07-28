/**
 * Bloco `divider` (layout) — o `Divider` do Astryx.
 *
 * Horizontal: a linha com rótulo central opcional (`label` é prop nativa do
 * DS — não existe mais um "filho de texto" a posicionar na mão).
 *
 * Vertical: o divisor precisa de altura para existir, e ela vem do RITMO da
 * página (padding dos rótulos na escala de espaçamento), nunca de uma altura
 * fixa — o `Divider` vertical se estica sozinho para acompanhar a linha.
 *
 * `spacing` existe porque o respiro era fixo em 6 passos (48px) nos dois lados:
 * num relatório denso, cada divisor abria um buraco maior que o próprio
 * intervalo entre as linhas do grid. Agora quem compõe escolhe o degrau.
 */
import { Divider } from '@astryxdesign/core/Divider';
import { HStack } from '@astryxdesign/core/HStack';
import type { SpacingStep } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type DividerSpacing = 'sm' | 'md' | 'lg';
type DividerProps = {
  label?: string;
  orientation?: 'horizontal' | 'vertical';
  spacing?: DividerSpacing;
};

/** Respiro em volta da linha, na escala de espaçamento do DS. */
const SPACING_STEP: Record<DividerSpacing, SpacingStep> = { sm: 2, md: 4, lg: 6 };

/** Rótulo lateral da demonstração vertical ("antes" | "depois" do divisor). */
function SideLabel({ children }: { children: string }) {
  return (
    <VStack vAlign="center" paddingBlock={4}>
      <Text type="supporting" color="secondary">
        {children}
      </Text>
    </VStack>
  );
}

export const Component: BlockComponent<DividerProps> = ({ props }) => {
  const spacing = SPACING_STEP[props.spacing ?? 'md'] ?? SPACING_STEP.md;

  if (props.orientation === 'vertical') {
    return (
      <HStack
        gap={spacing}
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
      paddingBlock={spacing}
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
