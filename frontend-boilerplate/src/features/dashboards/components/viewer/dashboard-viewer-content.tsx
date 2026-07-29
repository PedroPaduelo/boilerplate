/**
 * Conteúdo da tela de VISUALIZAÇÃO do dashboard (`/dashboards/:id/view`).
 *
 * Modo de consumo, não de montagem: sem nada de edição, com a navegação de abas
 * na lateral e o grid ocupando o resto. Reusa `DashboardRenderer` — o MESMO da
 * edição e do preview — sem nenhuma mudança no render-engine: trocar de aba é
 * só trocar o `layout.rows` entregue a ele (ver `layoutOfTab`). É isso que
 * garante que o que se vê aqui é exatamente o que o editor montou.
 *
 * ABA ATIVA VIVE NA URL (`?tab=<id>`), e não em `useState`, porque abas são
 * navegação: voltar/avançar do navegador funciona, recarregar mantém a aba, e o
 * link colado para um colega abre na aba certa. `replace` na troca evita
 * entupir o histórico com um registro por clique de aba.
 *
 * DADOS: o batch é disparado para o dashboard INTEIRO (não por aba), de
 * propósito. Os blocos são hidratados por `blockId` num único payload; buscar
 * por aba faria cada troca re-disparar consulta e piscar o conteúdo já
 * carregado — e o backend já resolve todas as linhas de uma vez, porque `rows`
 * segue sendo a lista canônica (doc 40).
 *
 * SEM AÇÃO DE EDIÇÃO, e isso é a regra da tela, não um esquecimento. `/view` é
 * modo de CONSUMO: aqui não se edita. As ações do cabeçalho são as de quem está
 * LENDO — reprocessar, compartilhar, levar em PDF, trocar o período. Um
 * "Editar" aqui atravessaria o usuário para outra tela no meio da leitura (e,
 * num telão de reunião, é justamente o clique que ninguém quer dar por
 * acidente). Quem vai montar dashboard entra pela listagem (`/dashboards` →
 * menu da linha → Editar).
 */
import { useCallback, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Divider } from '@astryxdesign/core/Divider';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, Layout, LayoutContent, VStack } from '@astryxdesign/core/Layout';
import { Heading, Text } from '@astryxdesign/core/Text';
import { DashboardRenderer } from '@/shared/render-engine';
import { semanticIcon } from '@/shared/ui';
import type { ApiMode } from '@/shared/lib/query-keys';
import { hasPermission } from '@/shared/lib/rbac';
import { useAuthStore } from '@/features/auth/store';
import { useDashboardData } from '../../use-dashboard-data';
import { useExportDashboardPdf } from '../../use-export-pdf';
import type { DashboardDetail } from '../../types';
import {
  initialFilterValues,
  pickPeriodFilter,
  type DashFilter,
  type FilterValues,
} from '../../lib/dashboard-filters';
import {
  layoutOfTab,
  neighborTabId,
  pickTab,
  resolveTabs,
  shouldShowTabNav,
} from '../../lib/dashboard-tabs';
import { FilterBar } from '../filter-bar';
import { DashboardTabsSidebar } from './dashboard-tabs-sidebar';
import { DashboardViewerEmpty } from './dashboard-viewer-empty';
import { DashboardViewerHeader } from './dashboard-viewer-header';
import { useDashboardThemePreference } from './use-dashboard-theme';
import { useTabShortcuts } from './use-tab-shortcuts';

/** Nome do parâmetro de URL que guarda a aba ativa. */
export const TAB_SEARCH_PARAM = 'tab';

export interface DashboardViewerContentProps {
  detail: DashboardDetail;
  layout: DashboardDetail['layout'];
  mode: ApiMode;
}

export function DashboardViewerContent({
  detail,
  layout,
  mode,
}: DashboardViewerContentProps) {
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const filters = (layout?.filters ?? []) as DashFilter[];

  const [values, setValues] = useState<FilterValues>(() => initialFilterValues(filters));
  const filterInputRef = useRef<HTMLInputElement | null>(null);

  // Abas resolvidas pelo normalizador COMPARTILHADO com o backend: layout sem
  // `tabs` devolve uma aba implícita com tudo, então dashboard antigo continua
  // renderizando exatamente como antes — só que dentro desta tela.
  const tabs = resolveTabs(layout);
  const activeTab = pickTab(tabs, searchParams.get(TAB_SEARCH_PARAM));
  const showTabNav = shouldShowTabNav(tabs);

  const { payload, isFetching, isError, updatedAt, refetch } = useDashboardData({
    dashboardId: detail.id,
    mode,
    filters: values,
  });

  // Aparência declarada pelo dashboard — só vale para quem ainda não escolheu
  // tema. Ver a nota longa no hook.
  useDashboardThemePreference(layout);

  const role = useAuthStore((s) => s.user?.role);
  const canExport = hasPermission(role, 'artifacts:export');
  const canShare = hasPermission(role, 'share:create');
  const canCreate = hasPermission(role, 'artifacts:manage');
  const pdfExport = useExportDashboardPdf();

  const isPublished = mode === 'published';

  // O renderer recebe SÓ as linhas da aba ativa e `filters: []` (a FilterBar
  // interativa fica acima; ele desenharia chips estáticos duplicados).
  const gridLayout = layoutOfTab(layout, activeTab);

  // O filtro de período SOBE para o cabeçalho; a barra de filtros fica com o
  // resto. Sem isso, o mesmo controle apareceria duas vezes na tela.
  const periodFilter = pickPeriodFilter(filters);
  const barFilters = filters.filter((filter) => filter.id !== periodFilter?.id);

  const handleFilterChange = useCallback((filterId: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [filterId]: value }));
  }, []);

  /**
   * Endereço de uma aba. A barra lateral navega por LINK (`href`), não por
   * `onClick`: a aba já vivia na URL, então o link é a representação honesta —
   * e de quebra ganha ⌘/Ctrl+clique para abrir em nova guia, "copiar endereço"
   * e o botão do meio. Preserva os demais parâmetros da query (filtros, modo).
   */
  const hrefForTab = useCallback(
    (tabId: string) => {
      const next = new URLSearchParams(searchParams);
      next.set(TAB_SEARCH_PARAM, tabId);
      // `useLocation()` do router, NÃO o `location` global do navegador: dentro
      // de um `MemoryRouter` (testes) o global aponta para `/` e o link sairia
      // apontando para fora da rota.
      return `${pathname}?${next.toString()}`;
    },
    [pathname, searchParams],
  );

  // Atalho de teclado: mesma navegação do clique, mesma URL. `replace` porque
  // percorrer abas com o teclado não deve encher o histórico de voltas.
  const goToNeighbor = useCallback(
    (direction: 'previous' | 'next') => {
      if (!activeTab) return;
      const targetId = neighborTabId(tabs, activeTab.id, direction);
      if (!targetId) return;
      navigate(hrefForTab(targetId), { replace: true });
    },
    [activeTab, hrefForTab, navigate, tabs],
  );

  useTabShortcuts({
    isEnabled: showTabNav,
    onNavigate: goToNeighbor,
    filterInputRef,
  });

  const hasContent = gridLayout.rows.length > 0;
  const isDashboardEmpty = tabs.every((tab) => tab.rows.length === 0);

  const content = (
    <LayoutContent>
      {/* A região de conteúdo é rotulada com o título da aba: ao trocar de aba,
          o leitor de tela tem um landmark com o nome novo para entrar — sem
          isso, a navegação anuncia a mudança mas o conteúdo não se identifica.
          `key` remonta a região, então o rótulo é reanunciado. */}
      <VStack
        key={activeTab?.id}
        gap={4}
        as="section"
        aria-label={`Conteúdo da aba ${activeTab?.title ?? 'dashboard'}`}
      >
        {/*
          CABEÇALHO DA ABA — ícone + título + descrição.
          É o segundo nível de hierarquia da tela: o cabeçalho de cima
          identifica o DASHBOARD, este identifica a SEÇÃO que se está lendo.
          Sem ele, trocar de aba mudava os gráficos sem nada dizer onde o leitor
          tinha chegado. A divisória separa o "onde estou" do conteúdo em si.
        */}
        {showTabNav && activeTab ? (
          <VStack gap={2}>
            <HStack gap={2} vAlign="center">
              <Icon icon={semanticIcon(activeTab.icon)} color="accent" />
              <Heading level={3} maxLines={1}>
                {activeTab.title}
              </Heading>
            </HStack>
            {activeTab.description ? (
              <Text type="supporting" color="secondary" maxLines={2}>
                {activeTab.description}
              </Text>
            ) : null}
            <Divider />
          </VStack>
        ) : null}

        {hasContent ? (
          <DashboardRenderer layout={gridLayout} data={payload} />
        ) : (
          <DashboardViewerEmpty
            isDashboardEmpty={isDashboardEmpty}
            tabTitle={activeTab?.title}
            canCreate={canCreate}
            onAskAgent={() => navigate('/chat')}
          />
        )}
      </VStack>
    </LayoutContent>
  );

  return (
    <VStack gap={4}>
      <Layout
        height="auto"
        header={
          <VStack gap={3}>
            <DashboardViewerHeader
              title={detail.title}
              dashboardId={detail.id}
              isPublished={isPublished}
              periodFilter={periodFilter}
              values={values}
              onFilterChange={handleFilterChange}
              updatedAt={updatedAt}
              isFetching={isFetching}
              isError={isError}
              onRefresh={refetch}
              canShare={canShare}
              canExport={canExport}
              isExporting={pdfExport.exportingId === detail.id}
              onExport={() =>
                pdfExport.exportPdf(
                  { id: detail.id, title: detail.title },
                  { mode, filters: values },
                )
              }
            />
            <FilterBar
              filters={barFilters}
              values={values}
              onChange={handleFilterChange}
              onReset={
                filters.length > 0
                  ? () => setValues(initialFilterValues(filters))
                  : undefined
              }
            />
          </VStack>
        }
        // A barra lateral só aparece quando há MAIS DE UMA aba: uma navegação de
        // um item só é ruído visual e um landmark inútil no leitor de tela.
        start={
          showTabNav && activeTab ? (
            <DashboardTabsSidebar
              tabs={tabs}
              activeTabId={activeTab.id}
              hrefForTab={hrefForTab}
              filterInputRef={filterInputRef}
            />
          ) : undefined
        }
        content={content}
      />
    </VStack>
  );
}
