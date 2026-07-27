import { Shield, UserCheck, UserX, Users as UsersIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, StackItem, VStack } from '@astryxdesign/core/Layout';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text } from '@astryxdesign/core/Text';
import type { UserStats } from '../types';

/**
 * Resumo do quadro de usuários.
 *
 * O `kpi-card` legado ainda NÃO existe em `@/shared/ui` (trilha T1). Enquanto
 * não existir, cada métrica é montada aqui com `Card` + `Text` — um card por
 * métrica é o uso legítimo do componente ("uma métrica" é um item discreto).
 * Quando o compartilhado nascer, troque este arquivo por ele.
 */
const METRICS: { key: keyof UserStats; label: string; icon: LucideIcon }[] = [
  { key: 'total', label: 'Total de usuários', icon: UsersIcon },
  { key: 'active', label: 'Ativos', icon: UserCheck },
  { key: 'inactive', label: 'Inativos', icon: UserX },
  { key: 'admins', label: 'Admins', icon: Shield },
];

export interface UserStatsGridProps {
  stats: UserStats | undefined;
  isLoading: boolean;
}

export function UserStatsGrid({ stats, isLoading }: UserStatsGridProps) {
  return (
    <Grid columns={{ minWidth: 200, max: 4 }} gap={4}>
      {METRICS.map((metric, index) => (
        <Card key={metric.key} padding={4}>
          <VStack gap={2}>
            <HStack gap={2} vAlign="center">
              <StackItem size="fill">
                <Text type="supporting" maxLines={1}>
                  {metric.label}
                </Text>
              </StackItem>
              <Icon icon={metric.icon} size="sm" color="secondary" />
            </HStack>

            {isLoading ? (
              <Skeleton width={72} height={28} index={index} />
            ) : (
              <Text type="display-3" hasTabularNumbers>
                {/* Sem dado, mostra travessão: exibir "0" seria informação falsa. */}
                {stats ? stats[metric.key] : '—'}
              </Text>
            )}
          </VStack>
        </Card>
      ))}
    </Grid>
  );
}
