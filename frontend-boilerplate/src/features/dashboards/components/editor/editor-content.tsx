/**
 * Corpo do editor: cabeçalho, barra de ações, coluna de EDIÇÃO e coluna de
 * PRÉ-VISUALIZAÇÃO lado a lado.
 *
 * Nada de estado de negócio aqui: o rascunho vive em `useEditorDraft` (cópia de
 * trabalho + baseline + salvar/publicar) e o preview em `useEditorPreview`
 * (modo + layout saneado + batch de dados). Este componente só liga uma coisa
 * na outra e distribui callbacks — o que mantém cada peça testável sozinha.
 *
 * As duas colunas são um `Grid` responsivo (e não duas colunas fixas): abaixo
 * de ~800px elas empilham, com a edição primeiro — em tela estreita o preview
 * é consulta, não a tarefa.
 */
import { Banner } from '@astryxdesign/core/Banner';
import { Grid } from '@astryxdesign/core/Grid';
import { VStack } from '@astryxdesign/core/Layout';
import { Heading, Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { useEditorDraft } from '../../use-editor-draft';
import { useEditorPreview } from '../../use-editor-preview';
import { addFilter, removeFilter, updateFilter } from '../../lib/layout-editor';
import type { DashboardDetail } from '../../types';
import { DashboardBreadcrumbs } from '../dashboard-breadcrumbs';
import { AddChartForm } from './add-chart-form';
import { EditorPreviewPanel } from './editor-preview-panel';
import { EditorToolbar } from './editor-toolbar';
import { FiltersEditor } from './filters-editor';
import { RowsEditor } from './rows-editor';

export interface EditorContentProps {
  detail: DashboardDetail;
}

export function EditorContent({ detail }: EditorContentProps) {
  const draft = useEditorDraft(detail);
  const isPublished = draft.status === 'PUBLISHED';

  const preview = useEditorPreview({
    dashboardId: detail.id,
    layout: draft.layout,
    publishedLayout: draft.publishedLayout,
    isPublished,
  });

  return (
    <VStack gap={4}>
      <DashboardBreadcrumbs
        title={detail.title}
        dashboardId={detail.id}
        current="Editar"
      />

      <VStack gap={1}>
        <Heading level={2}>Editar dashboard</Heading>
        <Text type="supporting">
          Ajuste filtros, linhas e blocos do rascunho. Nada chega a quem consome o
          dashboard até você publicar.
        </Text>
      </VStack>

      <EditorToolbar
        status={draft.status}
        isDirty={draft.isDirty}
        hasUnpublishedChanges={draft.hasUnpublishedChanges}
        canPublish={draft.canPublish}
        isSaving={draft.isSaving}
        isPublishing={draft.isPublishing}
        onSave={draft.save}
        onPublish={draft.publish}
        onUnpublish={draft.unpublish}
      />

      {draft.validationError ? (
        <Banner
          status="error"
          title="Layout inválido — corrija antes de salvar"
          description={<Text type="code">{draft.validationError}</Text>}
        />
      ) : null}

      <Grid columns={{ minWidth: 380, max: 2 }} gap={5} align="start">
        <VStack gap={5}>
          <TextInput
            label="Título do dashboard"
            value={draft.title}
            placeholder="Ex.: Dívida Ativa 2026"
            width="100%"
            onChange={draft.setTitle}
          />

          <FiltersEditor
            filters={draft.layout.filters}
            onAdd={() => draft.updateLayout((current) => addFilter(current))}
            onRemove={(filterId) =>
              draft.updateLayout((current) => removeFilter(current, filterId))
            }
            onUpdate={(filterId, patch) =>
              draft.updateLayout((current) => updateFilter(current, filterId, patch))
            }
          />

          <RowsEditor layout={draft.layout} onLayoutChange={draft.updateLayout} />

          <AddChartForm
            rows={draft.layout.rows}
            isDisabled={draft.isDirty}
            isPending={draft.isAddingChart}
            onAdd={draft.addChart}
          />
        </VStack>

        <EditorPreviewPanel
          mode={preview.mode}
          onModeChange={preview.setMode}
          layout={preview.layout}
          data={preview.data}
          isPublished={isPublished}
          hasUnsavedChanges={draft.isDirty}
        />
      </Grid>
    </VStack>
  );
}
