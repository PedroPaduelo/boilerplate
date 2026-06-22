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
import { Button } from '@/components/ui/button';
import { BlockRenderer } from '@/shared/render-engine';
import { useAuthStore } from '@/features/auth/store';
import { hasPermission } from '@/shared/lib/rbac';
import type { ChatChartPayload } from '../transport';
import { AddToDashboardDialog } from './add-to-dashboard-dialog';

export interface InlineChartProps {
  chart: ChatChartPayload;
}

export function InlineChart({ chart }: InlineChartProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
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
    <div
      data-slot="chat-inline-chart"
      className="mt-3 rounded-lg border border-border bg-background p-3"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{chart.title}</span>
        {canManage ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDialogOpen(true)}
            aria-label="Adicionar a um dashboard"
          >
            <Plus className="size-4" />
            Adicionar a um dashboard
          </Button>
        ) : null}
      </div>

      <BlockRenderer block={block} result={chart.result} />

      {canManage ? (
        <AddToDashboardDialog
          chart={chart}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      ) : null}
    </div>
  );
}
