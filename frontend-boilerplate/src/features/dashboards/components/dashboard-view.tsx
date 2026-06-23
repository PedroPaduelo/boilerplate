/**
 * Tela de DASHBOARD em modo VIEW (T-G1, refatorado em T-G1 bugfix) — `/dashboards/:id`.
 *
 * Junta tudo: carrega o LAYOUT (T-B3, `GET /dashboards/:id?mode=draft`), desenha a
 * FilterBar (topo) + grid 12-col via `DashboardRenderer` (render-engine T-I) e
 * hidrata os blocos com o batch + socket (`useDashboardData`, T-C/T-E).
 *
 * Modo efetivo (decisão LOCAL a partir do `data.status`):
 *  - `?mode=draft|published` força explicitamente.
 *  - Sem override: usa `published` se o dashboard está PUBLISHED (o que um
 *    consumidor espera ver), senão `draft` (preview do dono/editor).
 *
 * CORREÇÃO DO BUGFIX T-G1 (ressalva low `cmqpfbd0600h3` + trava ao carregar
 * dashboard publicado): o backend AGORA devolve o `status` no detalhe do modo
 * draft (sempre válido). Removemos o probe extra que fazia 2 GETs (probe +
 * detail) e o `key={`${detail.id}:${effectiveMode}`}` que REMONTAVA o
 * `DashboardViewContent` quando o modo mudava. A remontagem executava o
 * `useDashboardRealtime` (join/leave dashboard room) + re-inicializava o
 * estado dos filtros a partir dos defaults, e havia risco de loop com o batch
 * do modo publicado. Agora:
 *  - UMA query (sempre `mode=draft`) que retorna `status` junto do `layout`;
 *  - decisão do `mode` efetiva é PURA a partir de `data.status`/`data.layout`;
 *  - `DashboardViewContent` permanece montado durante a vida útil do
 *    DashboardView (a `key` foi para o `<DashboardView>` em si, que muda
 *    quando o `id` muda — não quando o modo muda).
 *
 * Mudança de filtro → novo objeto de filtros → novo `filtersHash` → re-dispara o
 * batch; o backend recomputa SÓ os blocos que escutam aquele filtro (cacheKey
 * por bloco do T-C) e o socket re-hidrata. `keepPreviousData` evita piscar os
 * blocos não-afetados (ver `useDashboardData`).
 */
import { useState } from 'react';
import type { DashboardLayout } from '@dashboards/contracts';
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
  pickEffectiveLayout,
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

  // UMA ÚNICA query, sempre com mode=draft (sempre válido — backend não
  // rejeita). O `status` vem junto: status='PUBLISHED' significa que o usuário
  // provavelmente quer ver a versão publicada (override ?mode= continua
  // tendo prioridade). Sem probe extra.
  const detailQuery = useDashboard(id, 'draft');
  const detail = detailQuery.data;

  if (detailQuery.isLoading && !detail) {
    return <DashboardViewSkeleton />;
  }

  if (detailQuery.isError || !detail) {
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

  // Modo efetivo: override (?mode=) tem prioridade; senão, escolhe published
  // quando o dashboard ESTÁ publicado (o que o consumidor espera ver).
  const wantsPublished =
    override === 'published' || (override == null && detail.status === 'PUBLISHED');
  const { mode: effectiveMode, layout } = pickEffectiveLayout(
    detail,
    wantsPublished ? 'published' : 'draft',
  );

  return (
    <DashboardViewContent
      // Remontar SÓ quando o dashboard muda — NUNCA quando o modo muda.
      // Antes havia `key={`${detail.id}:${effectiveMode}`}` aqui, que remontava
      // o conteúdo a cada troca de modo e disparava o join/leave do socket +
      // reinicialização dos filtros. Removido (ressalva `cmqpfbd0600h3`).
      key={detail.id}
      detail={detail}
      layout={layout}
      mode={effectiveMode}
      onBack={() => navigate('/dashboards')}
    />
  );
}

interface ContentProps {
  detail: DashboardDetail;
  layout: DashboardDetail['layout'];
  mode: ApiMode;
  onBack: () => void;
}

function DashboardViewContent({ detail, layout, mode, onBack }: ContentProps) {
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

  const handleChange = (filterId: string, value: unknown) =>
    setValues((prev) => ({ ...prev, [filterId]: value }));
  const handleReset = () => setValues(initialFilterValues(filters));

  // Passamos `filters: []` ao DashboardRenderer (ele renderiza chips estáticos);
  // a FilterBar interativa fica acima. Assim reusamos o grid/blocos do
  // render-engine sem duplicar a barra de filtros.
  const gridLayout: DashboardLayout = {
    filters: [],
    rows: (layout?.rows ?? []) as DashboardLayout['rows'],
  };

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