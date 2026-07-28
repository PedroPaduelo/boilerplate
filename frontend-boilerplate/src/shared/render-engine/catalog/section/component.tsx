/**
 * Bloco `section` — REGIÃO nomeada. O `BlockContainer` injeta o grid de filhos
 * (já montado com as props deste bloco) via `children`; aqui só se desenha o
 * cabeçalho e a superfície.
 *
 * O que mudou nesta repaginação:
 *
 *  - a superfície passou a ser `plain` por PADRÃO. Uma seção de dashboard
 *    envolve blocos que já são cards; pintá-la de card por default empilhava
 *    moldura sobre moldura e somava ~48px de padding a cada nível de
 *    aninhamento. Card virou escolha (`variant`);
 *  - o título perdeu o default de fábrica. O manifesto trazia
 *    `title: 'Seção'`, e como o `BlockRenderer` mescla `defaultProps` em TODA
 *    renderização, toda seção sem título aparecia com um cabeçalho escrito
 *    "Seção" — indistinguível de uma escolha do autor. Agora `title` é
 *    obrigatório no SCHEMA (o agente deve nomear a região; quem só quer
 *    organizar usa o bloco `grid`) e não tem default. O render ainda tolera a
 *    ausência — um layout salvo sem título vira um container puro em vez de
 *    ganhar um cabeçalho inventado —, mas essa tolerância é o recuo, não o
 *    caminho.
 *
 * Sem `children` (galeria do catálogo), mostra o placeholder ilustrativo.
 */
import { Divider } from '@astryxdesign/core/Divider';
import { Text, Heading } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { BlockSurface } from '../../block-surface';
import { resolveSurfaceVariant } from '../../lib/layout-options';
import type {
  BlockGridAlign,
  BlockGridGap,
  BlockItemSizing,
  BlockSurfaceVariant,
} from '../../lib/layout-options';
import type { BlockRowHeight } from '../../lib/block-sizing';
import { manifest } from './manifest';
import { fixture } from './fixture';
import { SectionPlaceholder } from './section-placeholder';

type SectionBlockProps = {
  title?: string;
  subtitle?: string;
  columns?: number;
  gap?: BlockGridGap;
  align?: BlockGridAlign;
  rowHeight?: BlockRowHeight;
  itemSizing?: BlockItemSizing;
  variant?: BlockSurfaceVariant;
};

/** Texto presente e não só espaço em branco. */
function filled(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

const Component: BlockComponent<SectionBlockProps> = ({ props, children }) => {
  const variant = resolveSurfaceVariant(props.variant);
  const hasTitle = filled(props.title);
  const hasSubtitle = filled(props.subtitle);

  return (
    <BlockSurface variant={variant} slot="section" as="section">
      {hasTitle || hasSubtitle ? (
        <VStack gap={0.5} data-slot="section-header">
          {hasTitle ? (
            <Heading level={3} maxLines={1}>
              {props.title}
            </Heading>
          ) : null}
          {hasSubtitle ? (
            <Text type="supporting" color="secondary">
              {props.subtitle}
            </Text>
          ) : null}
        </VStack>
      ) : null}

      {/* O divisor sob o cabeçalho é exclusivo da leitura densa (`framed`): nas
          outras superfícies o próprio espaço do `BlockSurface` já separa. */}
      {variant === 'framed' && (hasTitle || hasSubtitle) ? <Divider /> : null}

      {children ?? <SectionPlaceholder />}
    </BlockSurface>
  );
};

export { Component };

export const definition = defineBlock<SectionBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
