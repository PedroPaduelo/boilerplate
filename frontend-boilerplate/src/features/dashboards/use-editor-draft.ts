/**
 * Estado de edição de UM dashboard (o "rascunho de trabalho" do editor).
 *
 * Mantém uma cópia local (`title`/`layout`) e uma BASELINE (último estado
 * salvo): `isDirty` = trabalho ≠ baseline. Antes de salvar, o layout é validado
 * contra o CONTRATO (`validateLayoutForSave`), então o erro aparece em campo, em
 * português, sem round-trip à API.
 *
 * Salvar = PATCH /dashboards/:id (só o draft; não toca o publicado). O ciclo de
 * PUBLICAÇÃO vive em `useEditorPublication` e as comparações puras em
 * `lib/draft-state` — aqui fica só a costura entre os três, exposta como um
 * único objeto para o editor.
 */
import { useState, type Dispatch, type SetStateAction } from 'react';
import { useAddChartToDashboard, useUpdateDashboard } from './hooks';
import { useEditorPublication } from './use-editor-publication';
import { hasUnpublishedChanges, isDraftDirty } from './lib/draft-state';
import {
  normalizeLayout,
  validateLayoutForSave,
  type EditorLayout,
} from './lib/layout-editor';
import type { AddChartInput, ArtifactStatus, DashboardDetail } from './types';

export interface EditorDraft {
  title: string;
  setTitle: (title: string) => void;
  layout: EditorLayout;
  updateLayout: Dispatch<SetStateAction<EditorLayout>>;
  status: ArtifactStatus;
  /** Layout publicado (ou `null`) — base da comparação "há algo por publicar". */
  publishedLayout: EditorLayout | null;
  /** Há alterações locais ainda não salvas. */
  isDirty: boolean;
  /** O que está salvo difere do que está publicado. */
  hasUnpublishedChanges: boolean;
  canPublish: boolean;
  /** Mensagem do validador de contrato; `null` quando o layout está válido. */
  validationError: string | null;
  isSaving: boolean;
  isPublishing: boolean;
  isAddingChart: boolean;
  save: () => void;
  publish: () => void;
  unpublish: () => void;
  addChart: (input: AddChartInput) => void;
}

export function useEditorDraft(detail: DashboardDetail): EditorDraft {
  const updateMut = useUpdateDashboard();
  const addChartMut = useAddChartToDashboard();
  const publication = useEditorPublication(detail);

  const [title, setTitle] = useState(detail.title);
  const [layout, updateLayout] = useState<EditorLayout>(() =>
    normalizeLayout(detail.draftLayout),
  );
  const [baseline, setBaseline] = useState(() => ({
    title: detail.title,
    layout: normalizeLayout(detail.draftLayout),
  }));
  const [validationError, setValidationError] = useState<string | null>(null);

  const save = () => {
    const result = validateLayoutForSave(layout);
    if (!result.valid) {
      setValidationError(result.error ?? 'Layout inválido.');
      return;
    }
    setValidationError(null);
    updateMut.mutate(
      { id: detail.id, input: { title, draftLayout: result.payload } },
      { onSuccess: () => setBaseline({ title, layout }) },
    );
  };

  // O backend monta o bloco e devolve o dashboard atualizado — a resposta vira
  // a nova baseline, senão a inserção apareceria como alteração não salva.
  const addChart = (input: AddChartInput) =>
    addChartMut.mutate(
      { id: detail.id, input },
      {
        onSuccess: (dashboard) => {
          const next = normalizeLayout(dashboard.draftLayout);
          updateLayout(next);
          setBaseline((prev) => ({ ...prev, layout: next }));
        },
      },
    );

  return {
    title,
    setTitle,
    layout,
    updateLayout,
    status: publication.status,
    publishedLayout: publication.publishedLayout,
    isDirty: isDraftDirty({ title, layout }, baseline),
    hasUnpublishedChanges: hasUnpublishedChanges(
      publication.status,
      baseline.layout,
      publication.publishedLayout,
    ),
    canPublish: publication.canPublish,
    validationError,
    isSaving: updateMut.isPending,
    isPublishing: publication.isPublishing,
    isAddingChart: addChartMut.isPending,
    save,
    // O que vai ao ar é o que está SALVO (baseline), não o trabalho em curso.
    publish: () => publication.publish(baseline.layout),
    unpublish: publication.unpublish,
    addChart,
  };
}
