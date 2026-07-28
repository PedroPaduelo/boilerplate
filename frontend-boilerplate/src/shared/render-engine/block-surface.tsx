/**
 * BlockSurface — a moldura OPCIONAL de um bloco container.
 *
 * Vive no motor (ao lado do `BlockFrame`, que é a moldura de um gráfico) porque
 * é uma decisão de RENDER, não um primitivo de tela: os três containers de
 * layout (`grid`, `section`, `collapsible_block`) precisam exatamente da mesma
 * escolha, e tê-la em um lugar só é o que impede o catálogo de voltar a ter uma
 * "variante card" diferente por bloco.
 *
 * O padrão é `plain`: um contêiner é uma DIV em volta — sem borda, sem sombra,
 * sem padding. Um container que se pinta de card por conta própria empilha
 * moldura sobre moldura (o card do container em volta do card de cada gráfico),
 * engorda a linha em ~48px de padding e rouba do gráfico a única moldura que
 * importa. Card virou o que sempre deveria ter sido: uma escolha explícita de
 * quem compõe.
 *
 *   plain   (default) só o espaço — a caixa não desenha nada;
 *   card              cartão do DS, com padding e elevação;
 *   framed            moldura fechada (divisores nas quatro bordas), leitura densa.
 */
import type { ReactNode } from 'react';
import { Card } from '@astryxdesign/core/Card';
import { Section } from '@astryxdesign/core/Section';
import type { SectionProps } from '@astryxdesign/core/Section';
import { VStack } from '@astryxdesign/core/VStack';
import type { BlockSurfaceVariant } from './lib/layout-options';

/** Bordas da variante `framed` (moldura fechada). */
const FRAME_DIVIDERS: SectionProps['dividers'] = ['top', 'bottom', 'start', 'end'];

/**
 * Padding interno das variantes que DESENHAM algo. `plain` fica em zero: sem
 * traço para afastar o conteúdo, o padding só empurraria o bloco para dentro
 * sem nenhuma leitura visual em troca.
 */
const SURFACE_PADDING = 4;

/**
 * Respiro entre o cabeçalho do container e a grade. Vale para as três
 * variantes: é o intervalo do RITMO da página, não da pintura.
 */
const SURFACE_GAP = 3;

export interface BlockSurfaceProps {
  variant: BlockSurfaceVariant;
  /** `data-slot` do container — usado para inspeção do DOM e nos testes. */
  slot: string;
  /** Elemento semântico da variante `plain` (ex.: `section` numa região). */
  as?: 'div' | 'section';
  children: ReactNode;
}

export function BlockSurface({ variant, slot, as = 'div', children }: BlockSurfaceProps) {
  if (variant === 'card') {
    return (
      <Card data-slot={slot} data-block-surface="card" padding={SURFACE_PADDING}>
        <VStack gap={SURFACE_GAP}>{children}</VStack>
      </Card>
    );
  }

  if (variant === 'framed') {
    return (
      <Section
        data-slot={slot}
        data-block-surface="framed"
        variant="transparent"
        dividers={FRAME_DIVIDERS}
        padding={SURFACE_PADDING}
      >
        <VStack gap={SURFACE_GAP}>{children}</VStack>
      </Section>
    );
  }

  // `plain`: a "div em volta". `VStack` (e não `<div>` cru) porque é o
  // primitivo de pilha do DS — ele já traz o reset de box e aceita o `as`
  // semântico, sem nenhuma pintura por padrão.
  return (
    <VStack as={as} data-slot={slot} data-block-surface="plain" gap={SURFACE_GAP}>
      {children}
    </VStack>
  );
}
