/**
 * COMPONENTE PRÓPRIO — casca comum de TODO gráfico do app. O Astryx não tem
 * data-viz, então as duas obrigações de um gráfico — cobrir carregando/sem
 * dados e se anunciar corretamente (imagem de dados, medidor ou progresso) —
 * precisavam morar num lugar só. Sem isto cada gráfico reinventaria os estados,
 * e algum deles desenharia eixo vazio em silêncio.
 */
import type { ReactNode } from 'react';
import { Center } from '@astryxdesign/core/Center';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden';

/** Mensagem padrão quando a consulta não devolveu linhas. */
export const CHART_EMPTY_MESSAGE = 'Sem dados para exibir';

/**
 * Papel ARIA da área de plotagem:
 * - `img`: gráfico (imagem de dados) — o padrão;
 * - `meter`: medida dentro de uma faixa conhecida (medidor radial);
 * - `progressbar`: progresso rumo a um total (círculo de progresso).
 */
export type ChartFrameRole = 'img' | 'meter' | 'progressbar';

export interface ChartFrameProps {
  /** Rótulo acessível — vira o `aria-label` da região de plotagem. */
  label: string;
  /** Equivalente textual dos dados, exposto só a leitores de tela. */
  summary?: string;
  /** Altura da área de plotagem, em px (geometria do desenho, não espaçamento). */
  height: number;
  /** Papel ARIA da região de plotagem. */
  role?: ChartFrameRole;
  /** Valor atual (medidor/progresso). */
  valueNow?: number;
  /** Mínimo da escala (medidor/progresso). */
  valueMin?: number;
  /** Máximo da escala (medidor/progresso). */
  valueMax?: number;
  /** Leitura do valor em texto (ex.: "73% de 100"). */
  valueText?: string;
  /** Centraliza a plotagem — para desenhos de largura fixa (anéis). */
  isCentered?: boolean;
  /** Troca o gráfico por um `Skeleton` da mesma altura. */
  isLoading?: boolean;
  /** Sem dados: mostra `EmptyState` (ou uma linha de `Text`, se `isCompact`). */
  isEmpty?: boolean;
  /** Mensagem do estado vazio. */
  emptyMessage?: string;
  /** Versão enxuta (spark, medidor): o vazio vira uma linha de `Text`. */
  isCompact?: boolean;
  /** Conteúdo abaixo da plotagem — normalmente a `ChartLegend`. */
  footer?: ReactNode;
  /** A plotagem em si (recharts). */
  children: ReactNode;
}

/**
 * Envolve a plotagem com os estados obrigatórios e o contrato de a11y.
 *
 * O `summary` fica FORA da região com `role` de propósito: papéis como `img`
 * podam os descendentes da árvore de acessibilidade, então o equivalente
 * textual precisa ser irmão, não filho.
 */
export function ChartFrame({
  label,
  summary,
  height,
  role = 'img',
  valueNow,
  valueMin,
  valueMax,
  valueText,
  isCentered = false,
  isLoading = false,
  isEmpty = false,
  emptyMessage = CHART_EMPTY_MESSAGE,
  isCompact = false,
  footer,
  children,
}: ChartFrameProps) {
  if (isLoading) {
    return (
      <Skeleton
        height={height}
        radius={2}
        aria-label={`Carregando ${label}`}
        data-slot="chart-loading"
      />
    );
  }

  if (isEmpty) {
    return (
      <Center height={height} width="100%" data-slot="chart-empty">
        {isCompact ? (
          <Text type="supporting" color="secondary">
            {emptyMessage}
          </Text>
        ) : (
          <EmptyState isCompact title={emptyMessage} description={label} />
        )}
      </Center>
    );
  }

  return (
    <VStack gap={2} width="100%" data-slot="chart">
      <VStack
        role={role}
        aria-label={label}
        aria-valuenow={valueNow}
        aria-valuemin={valueMin}
        aria-valuemax={valueMax}
        aria-valuetext={valueText}
        height={height}
        width="100%"
        hAlign={isCentered ? 'center' : 'stretch'}
      >
        {children}
      </VStack>
      {footer}
      {summary ? <VisuallyHidden>{summary}</VisuallyHidden> : null}
    </VStack>
  );
}
