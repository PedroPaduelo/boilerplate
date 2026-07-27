/**
 * Esqueleto da tabela de gráficos.
 *
 * Repete a GEOMETRIA das linhas reais (título largo + colunas curtas) para a
 * lista não "pular" quando os dados chegam. O `index` escalona a animação.
 */
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Skeleton } from '@astryxdesign/core/Skeleton';

export interface ChartsTableSkeletonProps {
  /** Quantas linhas fantasma desenhar. */
  rows?: number;
}

export function ChartsTableSkeleton({ rows = 6 }: ChartsTableSkeletonProps) {
  return (
    <VStack gap={2} aria-busy="true" aria-live="polite" aria-label="Carregando gráficos">
      <Skeleton height={32} radius={2} index={0} />
      {Array.from({ length: rows }).map((_, i) => (
        <HStack key={`chart-skeleton-${i}`} gap={3} vAlign="center">
          <Skeleton height={20} radius={2} index={i + 1} />
          <Skeleton width={120} height={20} radius={2} index={i + 1} />
          <Skeleton width={120} height={20} radius={2} index={i + 1} />
          <Skeleton width={150} height={20} radius={2} index={i + 1} />
        </HStack>
      ))}
    </VStack>
  );
}
