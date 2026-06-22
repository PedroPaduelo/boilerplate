/**
 * Diálogo "Adicionar a um dashboard" — usa a API REAL.
 *
 * Fluxo: lista dashboards (GET /dashboards, filtrados aos que o usuário pode
 * MODIFICAR) + conexões (GET /connections) → materializa um Chart real
 * (POST /charts) com o `dataBinding` do agente apontando para a conexão escolhida
 * → adiciona como bloco no dashboard (POST /dashboards/:id/blocks). Feedback via
 * toast (no hook). Prova a integração do chat com o resto do sistema mesmo com o
 * agente mockado.
 */
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/features/auth/store';
import { canModifyArtifact } from '@/shared/lib/artifact-rbac';
import { useDashboards } from '@/features/dashboards/hooks';
import { useConnections } from '@/features/connections/hooks';
import type { ChatChartPayload } from '../transport';
import { useAddGeneratedChartToDashboard } from '../hooks';

export interface AddToDashboardDialogProps {
  chart: ChatChartPayload;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddToDashboardDialog({
  chart,
  open,
  onOpenChange,
}: AddToDashboardDialogProps) {
  const user = useAuthStore((s) => s.user);
  const dashboardsQuery = useDashboards();
  const connectionsQuery = useConnections();
  const mutation = useAddGeneratedChartToDashboard();

  const [dashboardId, setDashboardId] = useState('');
  const [connectionId, setConnectionId] = useState('');

  // Só dashboards que o usuário pode modificar (owner ou ADMIN) — espelha o backend.
  const dashboards = (dashboardsQuery.data?.dashboards ?? []).filter((d) =>
    canModifyArtifact({
      role: user?.role,
      currentUserId: user?.id,
      ownerId: d.ownerId,
      status: d.status,
    }),
  );
  const connections = connectionsQuery.data?.connections ?? [];

  // Defaults efetivos (sem useEffect — evita set-state-in-effect): primeiro item.
  const effectiveDashboardId = dashboardId || dashboards[0]?.id || '';
  const effectiveConnectionId = connectionId || connections[0]?.id || '';

  const canSubmit =
    !!effectiveDashboardId && !!effectiveConnectionId && !mutation.isPending;

  const handleConfirm = () => {
    if (!canSubmit) return;
    mutation.mutate(
      {
        dashboardId: effectiveDashboardId,
        chart,
        connectionId: effectiveConnectionId,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar ao dashboard</DialogTitle>
          <DialogDescription>
            “{chart.title}” será criado como um gráfico e adicionado ao rascunho do
            dashboard escolhido.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-dash-select">Dashboard</Label>
            {dashboards.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Você não tem dashboards que possa editar. Crie um dashboard primeiro.
              </p>
            ) : (
              <Select
                value={effectiveDashboardId}
                onValueChange={setDashboardId}
              >
                <SelectTrigger id="add-dash-select" aria-label="Dashboard">
                  <SelectValue placeholder="Selecione um dashboard" />
                </SelectTrigger>
                <SelectContent>
                  {dashboards.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-conn-select">Conexão de dados</Label>
            {connections.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma conexão disponível. Cadastre uma conexão para materializar o
                gráfico.
              </p>
            ) : (
              <Select value={effectiveConnectionId} onValueChange={setConnectionId}>
                <SelectTrigger id="add-conn-select" aria-label="Conexão de dados">
                  <SelectValue placeholder="Selecione uma conexão" />
                </SelectTrigger>
                <SelectContent>
                  {connections.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!canSubmit}>
            {mutation.isPending ? 'Adicionando…' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
