/**
 * Diálogo "Adicionar a um dashboard" — usa a API REAL.
 *
 * Fluxo: lista dashboards (GET /dashboards, filtrados aos que o usuário pode
 * MODIFICAR) + conexões (GET /connections) → materializa um Chart real
 * (POST /charts) com o `dataBinding` do agente apontando para a conexão escolhida
 * → adiciona como bloco no dashboard (POST /dashboards/:id/blocks). Feedback via
 * toast (no hook).
 */
import { useState } from 'react';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import {
  Layout,
  LayoutContent,
  LayoutFooter,
  HStack,
  VStack,
} from '@astryxdesign/core/Layout';
import { Selector } from '@astryxdesign/core/Selector';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { useAuthStore } from '@/features/auth/store';
import { canModifyArtifact } from '@/shared/lib/artifact-rbac';
import { useDashboards } from '@/features/dashboards/hooks';
import { useConnections } from '@/features/connections/hooks';
import type { ChatChartPayload } from '../transport';
import { useAddGeneratedChartToDashboard } from '../hooks';

export interface AddToDashboardDialogProps {
  chart: ChatChartPayload;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function AddToDashboardDialog({
  chart,
  isOpen,
  onOpenChange,
}: AddToDashboardDialogProps) {
  const user = useAuthStore((s) => s.user);
  const dashboardsQuery = useDashboards();
  const connectionsQuery = useConnections();
  const mutation = useAddGeneratedChartToDashboard();

  const [dashboardId, setDashboardId] = useState('');
  const [connectionId, setConnectionId] = useState('');

  // Só dashboards que o usuário pode modificar (owner ou ADMIN) — espelha o backend.
  const dashboards = (dashboardsQuery.data?.dashboards ?? []).filter((dashboard) =>
    canModifyArtifact({
      role: user?.role,
      currentUserId: user?.id,
      ownerId: dashboard.ownerId,
      status: dashboard.status,
    }),
  );
  const connections = connectionsQuery.data?.connections ?? [];
  const isLoading = dashboardsQuery.isLoading || connectionsQuery.isLoading;

  // Defaults efetivos (sem useEffect — evita set-state-in-effect): primeiro item.
  const effectiveDashboardId = dashboardId || dashboards[0]?.id || '';
  const effectiveConnectionId = connectionId || connections[0]?.id || '';

  const blockedReason = !effectiveDashboardId
    ? 'Crie um dashboard que você possa editar para adicionar este gráfico.'
    : !effectiveConnectionId
      ? 'Cadastre uma conexão para materializar o gráfico.'
      : undefined;
  const canSubmit = !blockedReason && !mutation.isPending;

  const handleConfirm = () => {
    if (!canSubmit) return;
    mutation.mutate(
      {
        dashboardId: effectiveDashboardId,
        chart,
        connectionId: effectiveConnectionId,
      },
      { onSettled: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} purpose="form" width={480}>
      <Layout
        height="auto"
        header={
          <DialogHeader
            title="Adicionar ao dashboard"
            subtitle={`“${chart.title}” será criado como um gráfico e adicionado ao rascunho do dashboard escolhido.`}
            onOpenChange={onOpenChange}
          />
        }
        content={
          <LayoutContent>
            <VStack gap={4}>
              {isLoading ? (
                <VStack gap={3} aria-busy="true">
                  <Skeleton height={56} />
                  <Skeleton height={56} index={1} />
                </VStack>
              ) : (
                <>
                  {dashboards.length === 0 ? (
                    <Banner
                      status="warning"
                      title="Nenhum dashboard editável"
                      description="Crie um dashboard primeiro para poder adicionar o gráfico."
                    />
                  ) : (
                    <Selector
                      label="Dashboard"
                      placeholder="Selecione um dashboard"
                      value={effectiveDashboardId}
                      onChange={setDashboardId}
                      options={dashboards.map((dashboard) => ({
                        value: dashboard.id,
                        label: dashboard.title,
                      }))}
                    />
                  )}

                  {connections.length === 0 ? (
                    <Banner
                      status="warning"
                      title="Nenhuma conexão disponível"
                      description="Cadastre uma conexão para materializar o gráfico."
                    />
                  ) : (
                    <Selector
                      label="Conexão de dados"
                      placeholder="Selecione uma conexão"
                      value={effectiveConnectionId}
                      onChange={setConnectionId}
                      options={connections.map((connection) => ({
                        value: connection.id,
                        label: connection.name,
                      }))}
                    />
                  )}
                </>
              )}
            </VStack>
          </LayoutContent>
        }
        footer={
          <LayoutFooter hasDivider>
            <HStack gap={2} justify="end">
              <Button
                variant="ghost"
                label="Cancelar"
                onClick={() => onOpenChange(false)}
              />
              <Button
                variant="primary"
                label="Adicionar"
                isLoading={mutation.isPending}
                isDisabled={!canSubmit}
                tooltip={blockedReason}
                onClick={handleConfirm}
              />
            </HStack>
          </LayoutFooter>
        }
      />
    </Dialog>
  );
}
