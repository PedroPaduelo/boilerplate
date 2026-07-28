/**
 * Conteúdo da tela de dashboard em modo VIEW: cabeçalho, FilterBar e o grid.
 *
 * Mudança de filtro → novo objeto de filtros → novo `filtersHash` → re-dispara o
 * batch; o backend recomputa SÓ os blocos que escutam aquele filtro (cacheKey
 * por bloco do T-C) e o socket re-hidrata. `keepPreviousData` evita piscar os
 * blocos não-afetados (ver `useDashboardData`).
 */
import { useState } from 'react';
import type { DashboardLayout } from '@dashboards/contracts';
import { Download, Maximize2, RefreshCw } from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Heading } from '@astryxdesign/core/Text';
import { Toolbar } from '@astryxdesign/core/Toolbar';
import { DashboardRenderer } from '@/shared/render-engine';
import type { ApiMode } from '@/shared/lib/query-keys';
import { hasPermission } from '@/shared/lib/rbac';
import { useAuthStore } from '@/features/auth/store';
import { useDashboardData } from '../use-dashboard-data';
import { useExportDashboardPdf } from '../use-export-pdf';
import type { DashboardDetail } from '../types';
import {
  initialFilterValues,
  type DashFilter,
  type FilterValues,
} from '../lib/dashboard-filters';
import { DashboardBreadcrumbs } from './dashboard-breadcrumbs';
import { FilterBar } from './filter-bar';

export interface DashboardViewContentProps {
  detail: DashboardDetail;
  layout: DashboardDetail['layout'];
  mode: ApiMode;
}

export function DashboardViewContent({
  detail,
  layout,
  mode,
}: DashboardViewContentProps) {
  const filters = (layout?.filters ?? []) as DashFilter[];

  // Estado dos filtros, inicializado dos defaults do layout. O componente é
  // remontado (via `key={detail.id}`) quando o dashboard muda, então o
  // lazy-init pega os defaults certos — sem efeito de sincronização.
  const [values, setValues] = useState<FilterValues>(() => initialFilterValues(filters));

  const { payload, isFetching, refetch } = useDashboardData({
    dashboardId: detail.id,
    mode,
    filters: values,
  });

  const role = useAuthStore((s) => s.user?.role);
  const canExport = hasPermission(role, 'artifacts:export');
  const pdfExport = useExportDashboardPdf();

  const isPublished = mode === 'published';

  // O DashboardRenderer recebe `filters: []` (ele desenha chips estáticos); a
  // FilterBar interativa fica acima. Assim reusamos grid/blocos do render-engine
  // sem duplicar a barra de filtros.
  const gridLayout: DashboardLayout = {
    filters: [],
    rows: (layout?.rows ?? []) as DashboardLayout['rows'],
  };

  return (
    <VStack gap={4}>
      <DashboardBreadcrumbs title={detail.title} />

      <Toolbar
        label="Ações do dashboard"
        startContent={
          <HStack gap={2} vAlign="center">
            <Heading level={2} maxLines={1}>
              {detail.title}
            </Heading>
            <Badge
              variant={isPublished ? 'success' : 'neutral'}
              label={isPublished ? 'Publicado' : 'Rascunho'}
            />
          </HStack>
        }
        endContent={
          <HStack gap={2} vAlign="center">
            {/* Porta de entrada do modo de VISUALIZAÇÃO (doc 40): é lá que as
                abas do dashboard aparecem na barra lateral.

                Abre em GUIA NOVA (`target="_blank"`) porque a visualização é uma
                tela autônoma, sem o cromo do app — o uso é deixá-la aberta num
                telão ou numa segunda guia enquanto se continua trabalhando aqui.
                Trocar a guia atual por ela obrigaria a voltar para editar.

                `rel="noopener"` é higiene obrigatória de `_blank`: sem isso a
                página aberta recebe `window.opener` e pode navegar esta aqui. */}
            <Button
              label="Visualização"
              icon={<Icon icon={Maximize2} />}
              tooltip="Abre o modo de leitura em uma nova guia, com navegação por abas"
              href={`/dashboards/${detail.id}/view`}
              target="_blank"
              rel="noopener"
            />
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
                // O PDF espelha EXATAMENTE o que está na tela: mesmo modo
                // (rascunho/publicado) e mesmos valores de filtro.
                onClick={() =>
                  pdfExport.exportPdf(
                    { id: detail.id, title: detail.title },
                    { mode, filters: values },
                  )
                }
              />
            ) : null}
          </HStack>
        }
      />

      <FilterBar
        filters={filters}
        values={values}
        onChange={(filterId, value) =>
          setValues((prev) => ({ ...prev, [filterId]: value }))
        }
        onReset={
          filters.length > 0 ? () => setValues(initialFilterValues(filters)) : undefined
        }
      />

      <DashboardRenderer layout={gridLayout} data={payload} />
    </VStack>
  );
}
