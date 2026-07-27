/**
 * Gráfico INLINE no chat — renderiza o `ChatChartPayload` do agente com o MESMO
 * render-engine do dashboard (BlockRenderer) e oferece "Adicionar a um dashboard".
 *
 * O botão de adicionar usa a API REAL (POST /charts + POST /dashboards/:id/blocks)
 * e respeita RBAC (`artifacts:manage`) — defesa em profundidade, já que a rota
 * /chat também é gateada.
 */
import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Block } from '@dashboards/contracts';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { BlockRenderer } from '@/shared/render-engine';
import { useAuthStore } from '@/features/auth/store';
import { hasPermission } from '@/shared/lib/rbac';
import type { ChatChartPayload } from '../transport';
import { AddToDashboardDialog } from './add-to-dashboard-dialog';

export interface InlineChartProps {
  chart: ChatChartPayload;
}

export function InlineChart({ chart }: InlineChartProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const role = useAuthStore((s) => s.user?.role);
  const canManage = hasPermission(role, 'artifacts:manage');

  // Bloco sintético para o render-engine (mesmo contrato do dashboard).
  const block = {
    id: chart.result.blockId ?? 'chat_inline',
    type: chart.catalogType,
    span: 12,
    props: chart.props,
  } as Block;

  return (
    <Card padding={3}>
      <VStack gap={2}>
        <HStack gap={2} vAlign="center" justify="between">
          <Text type="label" maxLines={1}>
            {chart.title}
          </Text>
          {canManage ? (
            <Button
              size="sm"
              label="Adicionar a um dashboard"
              icon={<Icon icon={Plus} />}
              onClick={() => setIsDialogOpen(true)}
            />
          ) : null}
        </HStack>

        <BlockRenderer block={block} result={chart.result} />
      </VStack>

      {canManage ? (
        <AddToDashboardDialog
          chart={chart}
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      ) : null}
    </Card>
  );
}
