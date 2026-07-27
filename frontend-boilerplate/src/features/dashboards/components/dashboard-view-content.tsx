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
import { RefreshCw } from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Heading } from '@astryxdesign/core/Text';
import { Toolbar } from '@astryxdesign/core/Toolbar';
import { DashboardRenderer } from '@/shared/render-engine';
import type { ApiMode } from '@/shared/lib/query-keys';
import { useDashboardData } from '../use-dashboard-data';
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
          <Button
            label="Atualizar"
            icon={<Icon icon={RefreshCw} />}
            isLoading={isFetching}
            onClick={refetch}
          />
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
