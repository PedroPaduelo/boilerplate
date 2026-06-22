/**
 * Hooks da feature `chat` que tocam a API REAL (não o mock).
 *
 * `useAddGeneratedChartToDashboard` é a ponte entre o gráfico gerado (mockado)
 * pelo agente e o resto do sistema: materializa um Chart real (POST /charts) a
 * partir do `ChatChartPayload` e o adiciona a um dashboard (POST /dashboards/:id/
 * blocks). Isso prova a integração ponta-a-ponta mesmo com o agente mockado — e
 * permanece igual quando a T-H2 ligar a API real (o payload tem o mesmo formato).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { queryKeys } from '@/shared/lib/query-keys';
import { chartsApi } from '@/features/charts/api';
import { dashboardsApi } from '@/features/dashboards/api';
import type { ChatChartPayload } from './transport';

export interface AddGeneratedChartInput {
  /** Dashboard de destino (POST /dashboards/:id/blocks). */
  dashboardId: string;
  /** Gráfico gerado pelo agente. */
  chart: ChatChartPayload;
  /**
   * Conexão real onde o Chart será materializado. O `dataBinding` do mock tem um
   * `connectionId` placeholder; aqui injetamos a conexão escolhida pelo usuário.
   */
  connectionId: string;
}

export function useAddGeneratedChartToDashboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dashboardId, chart, connectionId }: AddGeneratedChartInput) => {
      // 1) Se o agente já criou o Chart via MCP (API real), reusa o chartId.
      //    No mock não há chartId → cria um Chart real materializando o dataBinding.
      let chartId = chart.chartId;
      if (!chartId) {
        const created = await chartsApi.create({
          title: chart.title,
          catalogType: chart.catalogType,
          draftProps: chart.props ?? {},
          draftDataBinding: {
            connectionId,
            query: chart.dataBinding?.query ?? '',
            params: chart.dataBinding?.params,
            transform: chart.dataBinding?.transform,
            ttlSeconds: chart.dataBinding?.ttlSeconds,
          },
        });
        chartId = created.id;
      }

      // 2) Adiciona o Chart como bloco no draft do dashboard.
      const dashboard = await dashboardsApi.addChart(dashboardId, { chartId });
      return { chartId, dashboard };
    },
    onSuccess: (_data, { dashboardId }) => {
      toast.success('Gráfico adicionado ao dashboard!');
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboards.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboards.detail(dashboardId, 'draft'),
      });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data', dashboardId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.charts.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Erro ao adicionar o gráfico ao dashboard'));
    },
  });
}
