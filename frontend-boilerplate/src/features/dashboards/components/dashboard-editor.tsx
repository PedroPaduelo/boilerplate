/**
 * Editor de dashboard ENXUTO (T-G2) — `/dashboards/:id/edit`.
 *
 * Decisão travada do MVP: SEM drag-and-drop. As operações são por
 * formulários/botões: reordenar blocos (dentro da row e entre rows), remover,
 * ajustar span, editar blocos narrativos (title/rich_text), ajustar filtros e o
 * `dataBinding`, adicionar um gráfico existente, e PUBLICAR/DESPUBLICAR.
 *
 * Estado: mantemos uma cópia de trabalho local (`layout`/`title`) e uma baseline
 * (último estado salvo). `dirty` = trabalho ≠ baseline. Antes de salvar, o layout
 * é validado contra o CONTRATO (`validateLayoutForSave`) para feedback claro sem
 * round-trip. Salvar = PATCH /dashboards/:id (só o draft; não toca o publicado).
 *
 * Preview: reusa o `DashboardRenderer` (T-I) + `useDashboardData` (T-C/T-E).
 * Alterna dev(draft)/published — modo dev SEMPRE busca dados frescos (staleTime 0,
 * `query-policies`/`use-dashboard-data`).
 *
 * RBAC: a rota exige `artifacts:manage`; aqui reforçamos a OWNERSHIP via
 * `canModifyArtifact` (403 se não-dono) e gateamos publicar com
 * `canPublishArtifact` (`artifacts:publish` + dono, ou ADMIN).
 */
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  Plus,
  Save,
  Trash2,
  UploadCloud,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardRenderer } from '@/shared/render-engine';
import { ForbiddenPage } from '@/shared/components/forbidden-page';
import type { ApiMode } from '@/shared/lib/query-keys';
import {
  canModifyArtifact,
  canPublishArtifact,
} from '@/shared/lib/artifact-rbac';
import { useAuthStore } from '@/features/auth/store';
import {
  useAddChartToDashboard,
  useDashboard,
  usePublishDashboard,
  useUpdateDashboard,
} from '../hooks';
import { useDashboardData } from '../use-dashboard-data';
import type { DashboardDetail } from '../types';
import { initialFilterValues, type DashFilter } from '../lib/dashboard-filters';
import {
  addFilter,
  addRow,
  layoutsEqual,
  moveBlockToAdjacentRow,
  moveBlockWithinRow,
  normalizeLayout,
  removeBlock,
  removeFilter,
  removeRow,
  sanitizeLayoutForSave,
  setBlockDataBinding,
  setBlockSpan,
  setRowTitle,
  updateBlockProps,
  updateFilter,
  validateLayoutForSave,
  type EditorLayout,
} from '../lib/layout-editor';
import { BlockEditorCard } from './editor/block-editor-card';
import { FiltersEditor } from './editor/filters-editor';
import { AddChartForm } from './editor/add-chart-form';

export function DashboardEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const detailQuery = useDashboard(id, 'draft');
  const detail = detailQuery.data;

  if (detailQuery.isLoading && !detail) return <EditorSkeleton />;

  if (detailQuery.isError || !detail) {
    return (
      <div className="flex flex-col gap-4">
        <BackButton onClick={() => navigate('/dashboards')} />
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive"
        >
          Não foi possível carregar este dashboard para edição.
        </div>
      </div>
    );
  }

  // Ownership: a rota já garante `artifacts:manage`; aqui barramos quem não é dono.
  const canEdit = canModifyArtifact({
    role: user?.role,
    currentUserId: user?.id,
    ownerId: detail.ownerId,
    status: detail.status,
  });
  if (!canEdit) return <ForbiddenPage />;

  return (
    <EditorContent
      key={detail.id}
      detail={detail}
      onBack={() => navigate(`/dashboards/${detail.id}`)}
    />
  );
}

interface ContentProps {
  detail: DashboardDetail;
  onBack: () => void;
}

function EditorContent({ detail, onBack }: ContentProps) {
  const user = useAuthStore((s) => s.user);
  const updateMut = useUpdateDashboard();
  const publishMut = usePublishDashboard();
  const addChartMut = useAddChartToDashboard();

  const [title, setTitle] = useState(detail.title);
  const [layout, setLayout] = useState<EditorLayout>(() => normalizeLayout(detail.draftLayout));
  const [baseline, setBaseline] = useState(() => ({
    title: detail.title,
    layout: normalizeLayout(detail.draftLayout),
  }));
  const [status, setStatus] = useState(detail.status);
  const [publishedLayout, setPublishedLayout] = useState<EditorLayout | null>(() =>
    detail.publishedLayout ? normalizeLayout(detail.publishedLayout) : null,
  );
  const [previewMode, setPreviewMode] = useState<ApiMode>('draft');
  const [validationError, setValidationError] = useState<string | null>(null);

  const dirty = title !== baseline.title || !layoutsEqual(layout, baseline.layout);
  const unpublished =
    status !== 'PUBLISHED' ||
    !publishedLayout ||
    !layoutsEqual(baseline.layout, publishedLayout);

  const canPublish = canPublishArtifact({
    role: user?.role,
    currentUserId: user?.id,
    ownerId: detail.ownerId,
    status,
  });

  /* --------------------------------------------------------- save/publish - */

  const handleSave = () => {
    const result = validateLayoutForSave(layout);
    if (!result.valid) {
      setValidationError(result.error ?? 'Layout inválido.');
      return;
    }
    setValidationError(null);
    updateMut.mutate(
      { id: detail.id, input: { title, draftLayout: result.payload as never } },
      { onSuccess: () => setBaseline({ title, layout }) },
    );
  };

  const handlePublish = () => {
    publishMut.mutate(
      { id: detail.id, publish: true },
      {
        onSuccess: () => {
          setStatus('PUBLISHED');
          setPublishedLayout(baseline.layout);
        },
      },
    );
  };

  const handleUnpublish = () => {
    publishMut.mutate(
      { id: detail.id, publish: false },
      {
        onSuccess: () => {
          setStatus('DRAFT');
          setPublishedLayout(null);
        },
      },
    );
  };

  const handleAddChart = (input: Parameters<typeof addChartMut.mutate>[0]['input']) => {
    addChartMut.mutate(
      { id: detail.id, input },
      {
        onSuccess: (dashboard) => {
          const nl = normalizeLayout(dashboard.draftLayout);
          setLayout(nl);
          setBaseline((b) => ({ ...b, layout: nl }));
        },
      },
    );
  };

  /* ---------------------------------------------------------------- preview */

  const previewFilters = useMemo(
    () => initialFilterValues(layout.filters as DashFilter[]),
    [layout.filters],
  );
  const previewLayout = useMemo(() => {
    if (previewMode === 'published') {
      return publishedLayout
        ? sanitizeLayoutForSave(publishedLayout)
        : { filters: [], rows: [] };
    }
    return sanitizeLayoutForSave(layout);
  }, [previewMode, layout, publishedLayout]);

  const { payload } = useDashboardData({
    dashboardId: detail.id,
    mode: previewMode,
    filters: previewFilters,
    enabled: previewMode === 'draft' || status === 'PUBLISHED',
  });

  /* --------------------------------------------------------------- handlers */

  const saving = updateMut.isPending;
  const publishing = publishMut.isPending;

  return (
    <div className="flex flex-col gap-5">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton onClick={onBack} />
          <Badge variant={status === 'PUBLISHED' ? 'default' : 'secondary'}>
            {status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'}
          </Badge>
          <StateHint dirty={dirty} unpublished={unpublished} />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={dirty ? 'default' : 'outline'}
            size="sm"
            onClick={handleSave}
            disabled={!dirty || saving}
          >
            <Save className={saving ? 'animate-pulse' : undefined} /> Salvar
          </Button>
          {status === 'PUBLISHED' ? (
            <Button variant="outline" size="sm" onClick={handleUnpublish} disabled={!canPublish || publishing}>
              <XCircle /> Despublicar
            </Button>
          ) : null}
          <Button
            variant={!dirty && unpublished ? 'default' : 'outline'}
            size="sm"
            onClick={handlePublish}
            disabled={!canPublish || publishing}
          >
            <UploadCloud /> Publicar
          </Button>
        </div>
      </div>

      {/* título */}
      <div className="flex max-w-lg flex-col gap-1">
        <Label htmlFor="dash-title" className="text-xs">
          Título do dashboard
        </Label>
        <Input
          id="dash-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {validationError ? (
        <div
          role="alert"
          data-slot="validation-error"
          className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <strong>Layout inválido — corrija antes de salvar:</strong>
          <div className="mt-1 font-mono text-xs">{validationError}</div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* coluna de edição */}
        <div className="flex flex-col gap-5">
          <FiltersEditor
            filters={layout.filters as DashFilter[]}
            onAdd={() => setLayout((l) => addFilter(l))}
            onRemove={(fid) => setLayout((l) => removeFilter(l, fid))}
            onUpdate={(fid, patch) => setLayout((l) => updateFilter(l, fid, patch))}
          />

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Linhas e blocos</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLayout((l) => addRow(l))}
              >
                <Plus /> Linha
              </Button>
            </div>

            {layout.rows.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhuma linha. Adicione uma linha ou um gráfico.
              </p>
            ) : (
              layout.rows.map((row, rowIndex) => (
                <div
                  key={row.id}
                  data-slot="row-editor"
                  data-row-id={row.id}
                  className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-3"
                >
                  <div className="flex items-center gap-2">
                    <Input
                      className="h-8"
                      placeholder={`Título da linha ${rowIndex + 1} (opcional)`}
                      aria-label={`Título da linha ${rowIndex + 1}`}
                      value={row.title ?? ''}
                      onChange={(e) => setLayout((l) => setRowTitle(l, row.id, e.target.value))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      aria-label={`Remover linha ${rowIndex + 1}`}
                      onClick={() => setLayout((l) => removeRow(l, row.id))}
                    >
                      <Trash2 />
                    </Button>
                  </div>

                  {row.blocks.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Linha vazia.</p>
                  ) : (
                    row.blocks.map((block, blockIndex) => (
                      <BlockEditorCard
                        key={block.id}
                        block={block}
                        filters={layout.filters as DashFilter[]}
                        canMoveUp={blockIndex > 0}
                        canMoveDown={blockIndex < row.blocks.length - 1}
                        canMoveRowUp={rowIndex > 0}
                        canMoveRowDown={rowIndex < layout.rows.length - 1}
                        onMoveUp={() => setLayout((l) => moveBlockWithinRow(l, row.id, block.id, 'up'))}
                        onMoveDown={() => setLayout((l) => moveBlockWithinRow(l, row.id, block.id, 'down'))}
                        onMoveRowUp={() => setLayout((l) => moveBlockToAdjacentRow(l, block.id, 'up'))}
                        onMoveRowDown={() => setLayout((l) => moveBlockToAdjacentRow(l, block.id, 'down'))}
                        onRemove={() => setLayout((l) => removeBlock(l, block.id))}
                        onSpanChange={(span) => setLayout((l) => setBlockSpan(l, block.id, span))}
                        onPropsChange={(patch) => setLayout((l) => updateBlockProps(l, block.id, patch))}
                        onBindingChange={(binding) =>
                          setLayout((l) => setBlockDataBinding(l, block.id, binding))
                        }
                      />
                    ))
                  )}
                </div>
              ))
            )}
          </div>

          <AddChartForm
            rows={layout.rows}
            disabled={dirty}
            pending={addChartMut.isPending}
            onAdd={handleAddChart}
          />
        </div>

        {/* coluna de preview */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Eye className="size-4" /> Pré-visualização
            </h3>
            <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
              <Button
                type="button"
                variant={previewMode === 'draft' ? 'default' : 'ghost'}
                size="sm"
                className="h-7"
                onClick={() => setPreviewMode('draft')}
              >
                Dev (rascunho)
              </Button>
              <Button
                type="button"
                variant={previewMode === 'published' ? 'default' : 'ghost'}
                size="sm"
                className="h-7"
                onClick={() => setPreviewMode('published')}
                disabled={status !== 'PUBLISHED'}
              >
                Versão publicada
              </Button>
            </div>
          </div>
          {previewMode === 'draft' && dirty ? (
            <p className="text-xs text-muted-foreground">
              Os dados do preview refletem o rascunho salvo. Salve para atualizar os dados.
            </p>
          ) : null}
          <div className="rounded-lg border border-border bg-muted/10 p-4">
            <DashboardRenderer layout={previewLayout as never} data={payload} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StateHint({ dirty, unpublished }: { dirty: boolean; unpublished: boolean }) {
  if (dirty) {
    return (
      <span data-slot="state-hint" className="text-xs font-medium text-amber-600 dark:text-amber-500">
        Alterações não salvas
      </span>
    );
  }
  if (unpublished) {
    return (
      <span data-slot="state-hint" className="text-xs font-medium text-amber-600 dark:text-amber-500">
        Há alterações não publicadas
      </span>
    );
  }
  return (
    <span data-slot="state-hint" className="text-xs text-muted-foreground">
      Publicado e atualizado
    </span>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} aria-label="Voltar">
      <ArrowLeft /> Voltar
    </Button>
  );
}

function EditorSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-9 w-72" />
      <Skeleton className="h-9 w-96" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  );
}
