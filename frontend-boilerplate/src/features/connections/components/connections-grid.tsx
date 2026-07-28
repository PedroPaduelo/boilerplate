/**
 * GRADE de conexões — a visão de cartões da listagem (a densa é
 * `ConnectionsTable`).
 *
 * `minWidth: 320` na `Grid`: o endereço (`host:porta/banco`) é o que de fato
 * identifica uma conexão e é monoespaçado — abaixo disso ele trunca em quase
 * todo ambiente real e o card perde justamente o dado que o distingue dos
 * outros. Melhor cair para uma coluna a menos do que espremer.
 */
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import type { Connection } from '../types';
import { ConnectionCard } from './connection-card';

/** Largura mínima de uma célula antes da grade quebrar para menos colunas. */
const MIN_CARD_WIDTH = 320;

export interface ConnectionsGridProps {
  connections: Connection[];
  canManage: boolean;
  /** Id da conexão em teste agora (`null` quando nenhuma). */
  testingId: string | null;
  onTest: (connection: Connection) => void;
  onEdit: (connection: Connection) => void;
  onDelete: (connection: Connection) => void;
}

export function ConnectionsGrid({
  connections,
  canManage,
  testingId,
  onTest,
  onEdit,
  onDelete,
}: ConnectionsGridProps) {
  return (
    <Grid columns={{ minWidth: MIN_CARD_WIDTH }} gap={4}>
      {connections.map((connection) => (
        <ConnectionCard
          key={connection.id}
          connection={connection}
          canManage={canManage}
          isTesting={testingId === connection.id}
          onTest={onTest}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </Grid>
  );
}

/**
 * Esqueleto da grade: a MESMA silhueta do card real (cabeçalho com duas
 * linhas, dois pares de metadados, divisor e rodapé de ação). Reservar o
 * espaço no formato certo é o que impede a tela de saltar quando as conexões
 * chegam.
 */
export function ConnectionsGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <Grid
      columns={{ minWidth: MIN_CARD_WIDTH }}
      gap={4}
      role="status"
      aria-label="Carregando conexões"
    >
      {Array.from({ length: cards }).map((_, index) => (
        <Card key={`connection-card-skeleton-${index}`} padding={0}>
          <VStack>
            <VStack gap={2} padding={3}>
              <Skeleton width="60%" height={20} radius={1} index={index} />
              <Skeleton width="85%" height={14} radius={1} index={index} />
              <HStack gap={2} justify="between">
                <Skeleton width={90} height={14} radius={1} index={index} />
                <Skeleton width={70} height={14} radius={1} index={index} />
              </HStack>
              <HStack gap={2} justify="between">
                <Skeleton width={110} height={14} radius={1} index={index} />
                <Skeleton width={64} height={18} radius={1} index={index} />
              </HStack>
            </VStack>
            <Divider />
            <HStack padding={2}>
              <Skeleton width={88} height={28} radius={2} index={index} />
            </HStack>
          </VStack>
        </Card>
      ))}
    </Grid>
  );
}
