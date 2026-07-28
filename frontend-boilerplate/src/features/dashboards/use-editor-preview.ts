/**
 * A VERSÃO exibida no canvas do editor e os DADOS dela.
 *
 * O editor mostra o rascunho em edição (o caso normal) ou a versão publicada
 * (para comparar). O modo `draft` sempre busca dados frescos (staleTime 0 — ver
 * `query-policies`/`use-dashboard-data`); `published` só é consultado quando o
 * dashboard está publicado, senão o batch responderia 404.
 *
 * Este hook devolve o layout no formato de EDIÇÃO (`EditorLayout`), e não o
 * sanitizado do contrato, porque quem o consome é o canvas — que precisa dos
 * campos de trabalho (altura declarada, títulos, abas) para desenhar E para
 * editar. A conversão para o contrato acontece uma vez só, no salvar.
 */
import { useMemo, useState } from 'react';
import type { DashboardDataPayload } from '@dashboards/contracts';
import type { ApiMode } from '@/shared/lib/query-keys';
import { useDashboardData } from './use-dashboard-data';
import { initialFilterValues, type DashFilter } from './lib/dashboard-filters';
import type { EditorLayout } from './lib/layout-editor';

const EMPTY_LAYOUT: EditorLayout = { filters: [], rows: [] };

export interface UseEditorPreviewOptions {
  dashboardId: string;
  /** Layout em edição (o que o usuário vê no modo rascunho). */
  layout: EditorLayout;
  publishedLayout: EditorLayout | null;
  isPublished: boolean;
}

export interface EditorPreview {
  mode: ApiMode;
  setMode: (mode: ApiMode) => void;
  /** Layout do modo escolhido — é o que o canvas desenha. */
  layout: EditorLayout;
  data: DashboardDataPayload | undefined;
}

export function useEditorPreview({
  dashboardId,
  layout,
  publishedLayout,
  isPublished,
}: UseEditorPreviewOptions): EditorPreview {
  const [mode, setMode] = useState<ApiMode>('draft');

  const previewFilters = useMemo(
    () => initialFilterValues(layout.filters as DashFilter[]),
    [layout.filters],
  );

  // No modo publicado sem publicação, um layout vazio (e não o rascunho): o
  // canvas mostraria o rascunho dizendo que é o publicado.
  const shownLayout = mode === 'published' ? (publishedLayout ?? EMPTY_LAYOUT) : layout;

  const { payload } = useDashboardData({
    dashboardId,
    mode,
    filters: previewFilters,
    enabled: mode === 'draft' || isPublished,
  });

  return { mode, setMode, layout: shownLayout, data: payload };
}
