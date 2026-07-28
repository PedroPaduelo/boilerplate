/**
 * Pré-visualização do editor: alterna entre o RASCUNHO em edição e a VERSÃO
 * PUBLICADA, e busca os dados do modo escolhido.
 *
 * O modo `draft` sempre busca dados frescos (staleTime 0 — ver
 * `query-policies`/`use-dashboard-data`); `published` só é consultado quando o
 * dashboard está publicado, senão o batch responderia 404.
 */
import { useMemo, useState } from 'react';
import type { DashboardDataPayload, DashboardLayout } from '@dashboards/contracts';
import type { ApiMode } from '@/shared/lib/query-keys';
import { useDashboardData } from './use-dashboard-data';
import { initialFilterValues, type DashFilter } from './lib/dashboard-filters';
import { sanitizeLayoutForSave, type EditorLayout } from './lib/layout-editor';

const EMPTY_LAYOUT: DashboardLayout = { filters: [], rows: [] };

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
  layout: DashboardLayout;
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

  // `sanitizeLayoutForSave` devolve o layout na forma do CONTRATO (`{filters,
  // rows}` + `tabs` quando houver) porém tipado como `unknown[]` — a asserção
  // aqui é a fronteira única entre o modelo local do editor e o tipo do contrato.
  //
  // ABAS (doc 40): o preview mostra TODAS as linhas, achatadas, mesmo quando o
  // dashboard tem abas — o `DashboardRenderer` só lê `filters`/`rows` e ignora
  // `tabs`. É intencional: aqui o usuário está editando o dashboard inteiro e
  // precisa enxergar tudo o que mexeu. Quem quer conferir a divisão por aba usa
  // a tela de visualização (`/dashboards/:id/view`).
  const previewLayout = useMemo<DashboardLayout>(() => {
    const source = mode === 'published' ? publishedLayout : layout;
    if (!source) return EMPTY_LAYOUT;
    return sanitizeLayoutForSave(source) as unknown as DashboardLayout;
  }, [mode, layout, publishedLayout]);

  const { payload } = useDashboardData({
    dashboardId,
    mode,
    filters: previewFilters,
    enabled: mode === 'draft' || isPublished,
  });

  return { mode, setMode, layout: previewLayout, data: payload };
}
