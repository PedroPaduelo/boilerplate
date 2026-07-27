/**
 * Bloco `dashboard_panel` — CONTAINER de layout. O `BlockRenderer` injeta o
 * sub-grid de filhos (já renderizados) via `children`; este componente só
 * desenha o shell e coloca `children` no corpo.
 *
 * QUANDO RENDERIZA O CABEÇALHO:
 *   - `title` EXPLÍCITO e não-vazio → cabeçalho com `title` + `description`.
 *   - `title` ausente / vazio / igual ao default ("Painel" legado) → SEM
 *     cabeçalho: vira um container puro com o `children`. Isso evita o título
 *     DUPLICADO quando o painel já está aninhado numa `section` homônima.
 *
 * SUPERFÍCIE: `card` usa o `Card` do DS (painel discreto, com elevacão);
 * `framed` usa uma `Section` com moldura e cabeçalho divisor (leitura densa).
 *
 * Sem `children` (galeria do catálogo), mostra o placeholder ilustrativo.
 */
import { Card } from '@astryxdesign/core/Card';
import { Layout, LayoutContent, LayoutHeader } from '@astryxdesign/core/Layout';
import { Section } from '@astryxdesign/core/Section';
import type { SectionProps } from '@astryxdesign/core/Section';
import { Text, Heading } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import type { ReactNode } from 'react';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';
import { DashboardPanelPlaceholder } from './panel-placeholder';

type PanelVariant = 'card' | 'framed';
type DashboardPanelBlockProps = {
  title?: string;
  description?: string;
  variant?: PanelVariant;
};

/** Títulos "default" herdados — se o autor não trocou, escondemos o header. */
const DEFAULT_TITLES = new Set(['Painel']);
/** Bordas do container na variante `framed` (moldura fechada). */
const FRAME_DIVIDERS: SectionProps['dividers'] = ['top', 'bottom', 'start', 'end'];

function isExplicitTitle(raw: string | undefined): boolean {
  if (raw == null) return false;
  const t = raw.trim();
  if (t.length === 0) return false;
  if (DEFAULT_TITLES.has(t)) return false;
  return true;
}

/** Superfície do painel: cartão (default) ou moldura densa. */
function PanelSurface({
  variant,
  slot,
  children,
}: {
  variant: PanelVariant;
  slot: string;
  children: ReactNode;
}) {
  if (variant === 'framed') {
    return (
      <Section
        data-slot={slot}
        data-dashboard-panel-variant={variant}
        variant="transparent"
        dividers={FRAME_DIVIDERS}
        padding={0}
      >
        {children}
      </Section>
    );
  }
  return (
    <Card data-slot={slot} data-dashboard-panel-variant={variant} padding={0}>
      {children}
    </Card>
  );
}

export const Component: BlockComponent<DashboardPanelBlockProps> = ({
  props,
  children,
}) => {
  const variant: PanelVariant = props.variant ?? 'card';
  const hasTitle = isExplicitTitle(props.title);
  const hasDescription =
    typeof props.description === 'string' && props.description.trim().length > 0;
  const body = children ?? <DashboardPanelPlaceholder />;

  // Sem cabeçalho explícito → container puro (só superfície + corpo). O corpo
  // fica flush na variante densa (`framed`), como no painel legado.
  if (!hasTitle && !hasDescription) {
    return (
      <PanelSurface variant={variant} slot="dashboard-panel-body-only">
        <VStack padding={variant === 'framed' ? 0 : 4}>{body}</VStack>
      </PanelSurface>
    );
  }

  return (
    <PanelSurface variant={variant} slot="dashboard-panel">
      <Layout
        height="auto"
        header={
          <LayoutHeader hasDivider={variant === 'framed'}>
            <VStack gap={0.5}>
              {hasTitle ? (
                <Heading level={3} maxLines={1}>
                  {props.title}
                </Heading>
              ) : null}
              {hasDescription ? (
                <Text type="supporting" color="secondary">
                  {props.description}
                </Text>
              ) : null}
            </VStack>
          </LayoutHeader>
        }
        content={<LayoutContent isScrollable={false}>{body}</LayoutContent>}
      />
    </PanelSurface>
  );
};

export const definition = defineBlock<DashboardPanelBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
