/**
 * Visão geral — a tela inicial (`/home`).
 *
 * Antes a raiz redirecionava direto para `/dashboards`: quem entrava caía numa
 * lista (às vezes vazia) sem contexto do que a plataforma faz nem do que fazer
 * a seguir. Esta tela responde três perguntas em uma olhada:
 *   1. Como está meu ambiente?  → faixa de indicadores
 *   2. O que eu faço agora?     → ações do cabeçalho / primeiros passos
 *   3. Onde eu estava?          → artefatos recentes
 *
 * Aqui só há ORQUESTRAÇÃO: os dados vêm inteiros de `useHomeOverview` e cada
 * pedaço da tela é um componente próprio. Nada é mockado — tudo deriva de
 * listagens que já existem.
 */
import { BarChart3, LayoutDashboard, MessageSquare, Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Grid } from '@astryxdesign/core/Grid';
import { Icon } from '@astryxdesign/core/Icon';
import { VStack } from '@astryxdesign/core/Stack';

import { hasPermission } from '@/shared/lib/rbac';
import { useAuthStore } from '@/features/auth/store';
import { useCreateDashboard } from '@/features/dashboards/hooks';

import { useHomeOverview } from '../use-home-overview';
import { HomeCatalogShortcut } from './home-catalog-shortcut';
import { HomeFirstSteps } from './home-first-steps';
import { HomeHeader } from './home-header';
import { HomeRecentList } from './home-recent-list';
import { HomeStats } from './home-stats';

export function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const role = user?.role;

  // RBAC de UI (espelha o backend): esconder o que o papel não pode fazer.
  const canManageArtifacts = hasPermission(role, 'artifacts:manage');
  const canUseConnections = hasPermission(role, 'connections:use');
  const canManageConnections = hasPermission(role, 'connections:manage');

  const overview = useHomeOverview(canUseConnections);
  const create = useCreateDashboard();

  // Único destino que NÃO pode ser `href`: só existe depois da mutação, com o
  // id do rascunho recém-criado.
  const handleCreateDashboard = () =>
    create.mutate(undefined, {
      onSuccess: (created) => navigate(`/dashboards/${created.id}/edit`),
    });

  return (
    <VStack gap={6}>
      <HomeHeader
        userName={user?.name ?? undefined}
        canManageArtifacts={canManageArtifacts}
        isCreating={create.isPending}
        onCreateDashboard={handleCreateDashboard}
      />

      {overview.error ? (
        // Erro não é vazio: a tela não está sem conteúdo, está quebrada — e a
        // saída é tentar de novo, não criar algo.
        <Banner
          status="error"
          title="Não foi possível carregar o resumo do ambiente"
          description={overview.error}
          endContent={
            <Button
              label="Tentar de novo"
              size="sm"
              icon={<Icon icon={RefreshCw} />}
              onClick={overview.retry}
            />
          }
        />
      ) : (
        <>
          <HomeStats
            totalDashboards={overview.totalDashboards}
            totalCharts={overview.totalCharts}
            totalConnections={overview.totalConnections}
            healthyConnections={overview.healthyConnections}
            canUseConnections={canUseConnections}
            isLoading={overview.isLoadingCounts}
            isLoadingConnections={overview.isLoadingConnections}
            hasConnectionsError={overview.hasConnectionsError}
          />

          {overview.isFirstRun ? (
            <HomeFirstSteps
              hasConnection={overview.totalConnections > 0}
              hasChart={overview.totalCharts > 0}
              hasDashboard={overview.totalDashboards > 0}
              canManageArtifacts={canManageArtifacts}
              canManageConnections={canManageConnections}
              isCreatingDashboard={create.isPending}
              onCreateDashboard={handleCreateDashboard}
            />
          ) : (
            <Grid columns={{ minWidth: 320, max: 2 }} gap={5}>
              <HomeRecentList
                title="Dashboards recentes"
                icon={LayoutDashboard}
                items={overview.recentDashboards}
                isLoading={overview.isLoadingDashboards}
                itemHref={(item) => `/dashboards/${item.id}`}
                allHref="/dashboards"
                allLabel="Ver todos os dashboards"
                emptyTitle="Nenhum dashboard ainda"
                emptyDescription="Junte os gráficos que importam em um painel e ele aparece aqui."
                emptyAction={
                  canManageArtifacts ? (
                    <Button
                      size="sm"
                      label="Criar dashboard"
                      icon={<Icon icon={Plus} />}
                      isLoading={create.isPending}
                      onClick={handleCreateDashboard}
                    />
                  ) : undefined
                }
              />

              <HomeRecentList
                title="Gráficos recentes"
                icon={BarChart3}
                items={overview.recentCharts}
                isLoading={overview.isLoadingCharts}
                itemHref={(item) => `/charts/${item.id}`}
                allHref="/charts"
                allLabel="Ver todos os gráficos"
                emptyTitle="Nenhum gráfico ainda"
                emptyDescription="Pergunte em português ao agente e salve a resposta como gráfico."
                emptyAction={
                  canManageArtifacts ? (
                    <Button
                      size="sm"
                      label="Abrir o agente"
                      icon={<Icon icon={MessageSquare} />}
                      href="/chat"
                    />
                  ) : undefined
                }
              />
            </Grid>
          )}
        </>
      )}

      <HomeCatalogShortcut />
    </VStack>
  );
}
