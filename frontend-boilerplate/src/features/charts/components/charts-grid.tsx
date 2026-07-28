/**
 * GRADE de gráficos — a visão visual da listagem (a densa é `ChartsTable`).
 *
 * Uma grade só se paga quando as células são DIFERENTES entre si; doze cards
 * de ícone + título repetidos seriam pior que doze linhas. Aqui cada célula
 * carrega a miniatura AO VIVO do gráfico, que é justamente o que a tabela não
 * consegue mostrar — e é o critério real de reconhecimento em uma biblioteca
 * de gráficos ("é aquele de barras com a queda no fim").
 *
 * `minWidth: 300` na `Grid`: abaixo disso a miniatura 16:9 fica menor que
 * ~170px de altura e o gráfico deixa de ser legível — melhor cair para uma
 * coluna a menos do que espremer.
 */
import { Grid } from '@astryxdesign/core/Grid';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import type { DropdownMenuOption } from '@astryxdesign/core/DropdownMenu';
import type { Chart } from '../types';
import { ChartCard } from './chart-card';

/** Largura mínima de uma célula antes da grade quebrar para menos colunas. */
const MIN_CARD_WIDTH = 300;

export interface ChartsGridItem {
  chart: Chart;
  typeLabel: string;
  context: string;
  actions: DropdownMenuOption[];
}

export interface ChartsGridProps {
  items: ChartsGridItem[];
  onPrefetch: (id: string) => void;
}

export function ChartsGrid({ items, onPrefetch }: ChartsGridProps) {
  return (
    <Grid columns={{ minWidth: MIN_CARD_WIDTH }} gap={4}>
      {items.map((item) => (
        <ChartCard
          key={item.chart.id}
          chart={item.chart}
          typeLabel={item.typeLabel}
          context={item.context}
          actions={item.actions}
          onPrefetch={() => onPrefetch(item.chart.id)}
        />
      ))}
    </Grid>
  );
}

/**
 * Esqueleto da grade: a MESMA silhueta do card real (miniatura 16:9, divisor,
 * duas linhas de texto). Reservar o espaço no formato certo é o que impede a
 * tela de saltar quando os gráficos chegam.
 */
export function ChartsGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <Grid
      columns={{ minWidth: MIN_CARD_WIDTH }}
      gap={4}
      role="status"
      aria-label="Carregando gráficos"
    >
      {Array.from({ length: cards }).map((_, index) => (
        <Card key={`chart-card-skeleton-${index}`} padding={0}>
          <VStack>
            <VStack padding={3}>
              <Skeleton width="100%" height={150} radius={2} index={index} />
            </VStack>
            <Divider />
            <VStack gap={2} padding={3}>
              <Skeleton width="70%" height={20} radius={1} index={index} />
              <HStack gap={2} justify="between">
                <Skeleton width={90} height={14} radius={1} index={index} />
                <Skeleton width={70} height={14} radius={1} index={index} />
              </HStack>
            </VStack>
          </VStack>
        </Card>
      ))}
    </Grid>
  );
}
