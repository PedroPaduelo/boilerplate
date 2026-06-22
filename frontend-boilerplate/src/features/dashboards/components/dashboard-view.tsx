/**
 * Tela de DASHBOARD em modo VIEW (T-G1) — `/dashboards/:id`.
 *
 * Junta tudo: carrega o LAYOUT (T-B3, `GET /dashboards/:id?mode=`), desenha a
 * FilterBar (topo) + grid 12-col via `DashboardRenderer` (render-engine T-I) e
 * hidrata os blocos com o batch + socket (`useDashboardData`, T-C/T-E).
 *
 * Modo efetivo:
 *  - `?mode=draft|published` força explicitamente.
 *  - Sem override: usa `published` se o dashboard está PUBLISHED (o que um
 *    consumidor espera ver), senão `draft` (preview do dono/editor). O backend
 *    rejeita (400) `published` em dashboard não-publicado, por isso só pedimos
 *    `published` após confirmar o status via um probe em `draft`.
 *
 * Mudança de filtro → novo objeto de filtros → novo `filtersHash` → re-dispara o
 * batch; o backend recomputa SÓ os blocos que escutam aquele filtro (cacheKey
 * por bloco do T-C) e o socket re-hidrata. `keepPreviousData` evita piscar os
 * blocos não-afetados (ver `useDashboardData`).
 */
import { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardRenderer } from '@/shared/render-engine';
import type { ApiMode } from '@/shared/lib/query-keys';
import { useDashboard } from '../hooks';
import { useDashboardData } from '../use-dashboard-data';
import type { DashboardDetail } from '../types';
import {
  initialFilterValues,
  type DashFilter,
  type FilterValues,
} from '../lib/dashboard-filters';
import { FilterBar } from './filter-bar';

export function DashboardView() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const modeParam = searchParams.get('mode');
  const override: ApiMode | null =
    modeParam === 'draft' || modeParam === 'published' ? modeParam : null;

  // Probe em draft (sempre válido) para descobrir o status quando não há override.
  const probe = useDashboard(id, 'draft');
  const status = probe.data?.status;
  const effectiveMode: ApiMode =
    override ?? (status === 'PUBLISHED' ? 'published' : 'draft');

  // Detalhe no modo efetivo (deduplica com o probe quando é 'draft').
  const detailQuery = useDashboard(id, effectiveMode);
  const detail = detailQuery.data;

  if (probe.isLoading || (detailQuery.isLoading && !detail)) {
    return <DashboardViewSkeleton />;
  }

  if (probe.isError || detailQuery.isError || !detail) {
    return (
      <div className="flex flex-col gap-4">
        <BackButton onClick={() => navigate('/dashboards')} />
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive"
        >
          Não foi possível carregar este dashboard. Ele pode não existir, estar
          inacessível para o seu perfil, ou ainda não ter uma versão neste modo.
        </div>
      </div>
    );
  }

  return (
    <DashboardViewContent
      key={`${detail.id}:${effectiveMode}`}
      detail={detail}
      mode={effectiveMode}
      onBack={() => navigate('/dashboards')}
    />
  );
}

interface ContentProps {
  detail: DashboardDetail;
  mode: ApiMode;
  onBack: () => void;
}

function DashboardViewContent({ detail, mode, onBack }: ContentProps) {
  const layout = detail.layout;
  const filters = (layout?.filters ?? []) as DashFilter[];

  // Estado dos filtros, inicializado dos defaults do layout. O componente é
  // remontado (via `key`) quando o dashboard/modo muda, então o lazy-init pega
  // sempre os defaults certos — sem efeito de sincronização.
  const [values, setValues] = useState<FilterValues>(() => initialFilterValues(filters));

  const { payload, isFetching, refetch } = useDashboardData({
    dashboardId: detail.id,
    mode,
    filters: values,
  });

  const handleChange = (filterId: string, value: unknown) =>
    setValues((prev) => ({ ...prev, [filterId]: value }));
  const handleReset = () => setValues(initialFilterValues(filters));

  // Passamos `filters: []` ao DashboardRenderer (ele renderiza chips estáticos);
  // a FilterBar interativa fica acima. Assim reusamos o grid/blocos do
  // render-engine sem duplicar a barra de filtros.
  const gridLayout = { filters: [], rows: layout?.rows ?? [] };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton onClick={onBack} />
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {detail.title}
            </h1>
            <Badge variant={mode === 'published' ? 'default' : 'secondary'}>
              {mode === 'published' ? 'Publicado' : 'Rascunho'}
            </Badge>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refetch}
          disabled={isFetching}
          aria-label="Recarregar dados"
        >
          <RefreshCw className={isFetching ? 'animate-spin' : undefined} />
          Atualizar
        </Button>
      </div>

      <FilterBar
        filters={filters}
        values={values}
        onChange={handleChange}
        onReset={filters.length > 0 ? handleReset : undefined}
      />

      <DashboardRenderer layout={gridLayout} data={payload} />
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} aria-label="Voltar para a lista">
      <ArrowLeft />
      Dashboards
    </Button>
  );
}

function DashboardViewSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-14 w-full" />
      <div className="grid grid-cols-12 gap-4">
        <Skeleton className="col-span-4 h-32" />
        <Skeleton className="col-span-8 h-32" />
        <Skeleton className="col-span-12 h-48" />
      </div>
    </div>
  );
}
