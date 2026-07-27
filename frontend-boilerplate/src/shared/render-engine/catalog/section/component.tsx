/**
 * Bloco `section` — CONTAINER RECURSIVO. O `BlockRenderer` injeta o sub-grid de
 * filhos (já renderizados) via `children`; este componente só desenha o shell e
 * coloca `children` no corpo.
 *
 * O shell é uma `Section` do Astryx (região de página — não um Card: cards são
 * para itens discretos) com um `Layout` interno de duas zonas: cabeçalho e
 * corpo. Quem cuida do espaçamento entre elas é o próprio `Layout` — sumiu o
 * ajuste manual de padding (`pt-0`/`p-4`) que existia para compensar o header
 * duplicado do painel legado.
 *
 * `variant`:
 *  - `card` (default) — superfície de seção, cabeçalho sem divisor;
 *  - `framed`         — moldura (divisores nas quatro bordas) + divisor sob o
 *                       cabeçalho, para leitura densa.
 *
 * Sem `children` (galeria do catálogo), mostra o placeholder ilustrativo.
 */
import { Layout, LayoutContent, LayoutHeader } from '@astryxdesign/core/Layout';
import { Section } from '@astryxdesign/core/Section';
import type { SectionProps as DsSectionProps } from '@astryxdesign/core/Section';
import { Text, Heading } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';
import { SectionPlaceholder } from './section-placeholder';

type SectionVariant = 'card' | 'framed';
type SectionBlockProps = {
  title?: string;
  subtitle?: string;
  variant?: SectionVariant;
};

/** Bordas do container na variante `framed` (moldura fechada). */
const FRAME_DIVIDERS: DsSectionProps['dividers'] = ['top', 'bottom', 'start', 'end'];

const Component: BlockComponent<SectionBlockProps> = ({ props, children }) => {
  const variant: SectionVariant = props.variant ?? 'card';
  const isFramed = variant === 'framed';

  return (
    <Section
      data-slot="section"
      data-section-variant={variant}
      variant={isFramed ? 'transparent' : 'section'}
      dividers={isFramed ? FRAME_DIVIDERS : undefined}
      padding={0}
    >
      <Layout
        height="auto"
        header={
          <LayoutHeader hasDivider={isFramed}>
            <VStack gap={0.5}>
              <Heading level={3} maxLines={1}>
                {props.title ?? 'Seção'}
              </Heading>
              {props.subtitle ? (
                <Text type="supporting" color="secondary">
                  {props.subtitle}
                </Text>
              ) : null}
            </VStack>
          </LayoutHeader>
        }
        content={
          <LayoutContent isScrollable={false}>
            {children ?? <SectionPlaceholder />}
          </LayoutContent>
        }
      />
    </Section>
  );
};

export const definition = defineBlock<SectionBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
