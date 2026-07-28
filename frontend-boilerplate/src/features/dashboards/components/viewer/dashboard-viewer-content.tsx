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
 */
import { useLocation, useSearchParams } from 'react-router-dom';
import { Download, Pencil, RefreshCw } from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import {
  HStack,
  Layout,
  LayoutContent,
  LayoutHeader,
  VStack,
} from '@astryxdesign/core/Layout';
import { Heading, Text } from '@astryxdesign/core/Text';
import { DashboardRenderer } from '@/shared/render-engine';
import type { ApiMode } from '@/shared/lib/query-keys';
import { hasPermission } from '@/shared/lib/rbac';
import { useAuthStore } from '@/features/auth/store';
import { canModifyArtifact } from '@/shared/lib/artifact-rbac';
import { useDashboardData } from '../../use-dashboard-data';
import { useExportDashboardPdf } from '../../use-export-pdf';
import type { DashboardDetail } from '../../types';
import {
  initialFilterValues,
  type DashFilter,
  type FilterValues,
} from '../../lib/dashboard-filters';
import {
  layoutOfTab,
  pickTab,
  resolveTabs,
  shouldShowTabNav,
} from '../../lib/dashboard-tabs';
import { DashboardBreadcrumbs } from '../dashboard-breadcrumbs';
import { FilterBar } from '../filter-bar';
import { DashboardTabsSidebar } from './dashboard-tabs-sidebar';
import { useState } from 'react';

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
  // Só LEITURA da query: a troca de aba é navegação por link (ver `hrefForTab`),
  // então quem escreve a URL é o router, não este componente.
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const filters = (layout?.filters ?? []) as DashFilter[];

  const [values, setValues] = useState<FilterValues>(() => initialFilterValues(filters));

  // Abas resolvidas pelo normalizador COMPARTILHADO com o backend: layout sem
  // `tabs` devolve uma aba implícita com tudo, então dashboard antigo continua
  // renderizando exatamente como antes — só que dentro desta tela.
  const tabs = resolveTabs(layout);
  const activeTab = pickTab(tabs, searchParams.get(TAB_SEARCH_PARAM));
  const showTabNav = shouldShowTabNav(tabs);

  const { payload, isFetching, refetch } = useDashboardData({
    dashboardId: detail.id,
    mode,
    filters: values,
  });

  const user = useAuthStore((s) => s.user);
  const canExport = hasPermission(user?.role, 'artifacts:export');
  const canEdit = canModifyArtifact({
    role: user?.role,
    currentUserId: user?.id,
    ownerId: detail.ownerId,
    status: detail.status,
  });
  const pdfExport = useExportDashboardPdf();

  const isPublished = mode === 'published';

  // O renderer recebe SÓ as linhas da aba ativa e `filters: []` (a FilterBar
  // interativa fica acima; ele desenharia chips estáticos duplicados).
  const gridLayout = layoutOfTab(layout, activeTab);

  /**
   * Endereço de uma aba. A barra lateral navega por LINK (`href`), não por
   * `onClick`: a aba já vivia na URL, então o link é a representação honesta —
   * e de quebra ganha ⌘/Ctrl+clique para abrir em nova guia, "copiar endereço"
   * e o botão do meio. Preserva os demais parâmetros da query (filtros, modo).
   */
  const hrefForTab = (tabId: string) => {
    const next = new URLSearchParams(searchParams);
    next.set(TAB_SEARCH_PARAM, tabId);
    // `useLocation()` do router, NÃO o `location` global do navegador: dentro de
    // um `MemoryRouter` (testes) o global aponta para `/` e o link sairia
    // apontando para fora da rota.
    return `${pathname}?${next.toString()}`;
  };

  const content = (
    <LayoutContent>
      <VStack gap={4}>
        {/* A região de conteúdo é rotulada com o título da aba: ao trocar de
            aba, o leitor de tela tem um landmark com o nome novo para entrar —
            sem isso, a navegação anuncia a mudança mas o conteúdo não se
            identifica. `key` remonta a região, então o rótulo é reanunciado. */}
        <VStack
          key={activeTab?.id}
          gap={4}
          as="section"
          aria-label={`Conteúdo da aba ${activeTab?.title ?? 'dashboard'}`}
        >
          {showTabNav && activeTab ? (
            <Heading level={3} maxLines={1}>
              {activeTab.title}
            </Heading>
          ) : null}

          {gridLayout.rows.length === 0 ? (
            <Text type="supporting">Esta aba ainda não tem conteúdo.</Text>
          ) : (
            <DashboardRenderer layout={gridLayout} data={payload} />
          )}
        </VStack>
      </VStack>
    </LayoutContent>
  );

  return (
    <VStack gap={4}>
      <DashboardBreadcrumbs
        title={detail.title}
        dashboardId={detail.id}
        current="Visualização"
      />

      <Layout
        height="auto"
        header={
          <LayoutHeader hasDivider>
            <VStack gap={3}>
              <HStack gap={2} vAlign="center" hAlign="between" wrap="wrap">
                <HStack gap={2} vAlign="center">
                  <Heading level={2} maxLines={1}>
                    {detail.title}
                  </Heading>
                  <Badge
                    variant={isPublished ? 'success' : 'neutral'}
                    label={isPublished ? 'Publicado' : 'Rascunho'}
                  />
                </HStack>

                <HStack gap={2} vAlign="center">
                  <Button
                    label="Atualizar"
                    icon={<Icon icon={RefreshCw} />}
                    isLoading={isFetching}
                    onClick={refetch}
                  />
                  {canExport ? (
                    <Button
                      label="Exportar PDF"
                      icon={<Icon icon={Download} />}
                      isLoading={pdfExport.exportingId === detail.id}
                      tooltip="Gera um PDF desta visão, com os filtros aplicados"
                      onClick={() =>
                        pdfExport.exportPdf(
                          { id: detail.id, title: detail.title },
                          { mode, filters: values },
                        )
                      }
                    />
                  ) : null}
                  {canEdit ? (
                    <Button
                      label="Editar"
                      icon={<Icon icon={Pencil} />}
                      href={`/dashboards/${detail.id}/edit`}
                    />
                  ) : null}
                </HStack>
              </HStack>

              <FilterBar
                filters={filters}
                values={values}
                onChange={(filterId, value) =>
                  setValues((prev) => ({ ...prev, [filterId]: value }))
                }
                onReset={
                  filters.length > 0
                    ? () => setValues(initialFilterValues(filters))
                    : undefined
                }
              />
            </VStack>
          </LayoutHeader>
        }
        // A barra lateral só aparece quando há MAIS DE UMA aba: uma navegação de
        // um item só é ruído visual e um landmark inútil no leitor de tela.
        start={
          showTabNav && activeTab ? (
            <DashboardTabsSidebar
              tabs={tabs}
              activeTabId={activeTab.id}
              hrefForTab={hrefForTab}
            />
          ) : undefined
        }
        content={content}
      />
    </VStack>
  );
}
