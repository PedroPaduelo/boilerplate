/**
 * Corpo do editor: barra de ações fixa, CANVAS (o dashboard de verdade) e
 * INSPETOR (as propriedades do que está selecionado).
 *
 * O desenho mudou de "duas listas lado a lado" para "objeto + propriedades" —
 * o padrão dos editores de dashboard maduros (Grafana, Metabase, Retool) e a
 * resposta às três queixas medidas na tela antiga:
 *
 *   · 2557px de rolagem de formulários para 9 blocos → o canvas mostra o
 *     dashboard inteiro em uma tela e a edição acontece no lugar;
 *   · o preview espremido em 792px (que renderizava 2 colunas onde a tela real
 *     mostra 3) → o canvas É o renderer, na largura de trabalho;
 *   · nenhuma forma de ajustar altura → altura por linha e por bloco, com
 *     degraus nomeados e uma saída para pixels.
 *
 * Nada de estado de negócio aqui: o rascunho vive em `useEditorDraft`, os dados
 * do preview em `useEditorPreview` e a seleção em `useEditorSelection`. Este
 * componente costura os três e distribui callbacks — o que mantém cada peça
 * testável sozinha.
 */
import { useMemo, useState } from 'react';
import { Banner } from '@astryxdesign/core/Banner';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Heading, Text } from '@astryxdesign/core/Text';
import { useEditorDraft } from '../../use-editor-draft';
import { useEditorPreview } from '../../use-editor-preview';
import { useEditorSaveGuard } from '../../use-editor-save-guard';
import { useEditorSelection } from '../../use-editor-selection';
import {
  addFilter,
  addRow,
  addTab,
  duplicateBlock,
  findBlock,
  moveBlockToAdjacentRow,
  moveBlockWithinRow,
  moveRow,
  moveTab,
  removeBlock,
  removeFilter,
  removeRow,
  removeTab,
  renameTab,
  setBlockDataBinding,
  setBlockHeight,
  setBlockSpan,
  setBlockText,
  setRowHeight,
  setRowTab,
  setRowTitle,
  updateBlockProps,
  updateFilter,
  type EditorRow,
} from '../../lib/layout-editor';
import type { DashboardDetail } from '../../types';
import { DashboardBreadcrumbs } from '../dashboard-breadcrumbs';
import { EditorCanvas } from './editor-canvas';
import { EditorInspector } from './editor-inspector';
import { EditorToolbar } from './editor-toolbar';
import { InspectorBlock } from './inspector-block';
import { InspectorDashboard } from './inspector-dashboard';
import { InspectorRow } from './inspector-row';
import { blockDisplayName } from './editor-fields';

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

  const selection = useEditorSelection(draft.layout);
  useEditorSaveGuard({
    isDirty: draft.isDirty,
    isSaving: draft.isSaving,
    onSave: draft.save,
  });

  const tabs = useMemo(() => draft.layout.tabs ?? [], [draft.layout.tabs]);
  const [requestedTabId, setRequestedTabId] = useState<string | null>(null);
  const activeTabId =
    tabs.find((tab) => tab.id === requestedTabId)?.id ?? tabs[0]?.id ?? null;

  /**
   * Linha pré-selecionada do formulário de inserção. Ela existe para que
   * "Adicionar gráfico" no cabeçalho de uma linha signifique NAQUELA linha — no
   * editor antigo o único caminho era um seletor genérico no fim da página, e
   * quem tinha oito linhas escolhia pelo nome, de memória.
   */
  const [targetRowId, setTargetRowId] = useState<string | null>(null);

  // O canvas mostra o layout do MODO escolhido. Em `published` ele é leitura:
  // as edições sempre vão para o rascunho (quem avisa disso é o próprio canvas,
  // logo acima do conteúdo — repetir o aviso no rodapé da página seria dizer a
  // mesma coisa duas vezes, longe de onde ela importa).
  const canvasLayout = preview.layout;

  /** Linhas da aba aberta, na ordem da aba (regra compartilhada do contrato). */
  const visibleRows = useMemo<EditorRow[]>(
    () => rowsOfTab(canvasLayout.rows, canvasLayout.tabs ?? [], activeTabId),
    [canvasLayout.rows, canvasLayout.tabs, activeTabId],
  );

  // Uma variável local (e não `selection.selection` repetido) para que o
  // TypeScript estreite o tipo da união dentro dos callbacks.
  const current = selection.selection;
  const selectedBlock =
    current.kind === 'block' ? findBlock(draft.layout, current.blockId) : null;
  const selectedRow =
    current.kind === 'row'
      ? (draft.layout.rows.find((row) => row.id === current.rowId) ?? null)
      : null;

  const openAddChart = (rowId: string) => {
    setTargetRowId(rowId);
    selection.clear();
  };

  /**
   * Selecionar qualquer coisa CANCELA a inserção pendente.
   *
   * Sem isso, clicar em "Adicionar gráfico" na linha 2 e depois abrir outro
   * bloco deixaria o formulário travado numa linha que o usuário já esqueceu —
   * e a próxima inserção cairia num lugar que ele não escolheu. A intenção de
   * inserir dura enquanto ela é a tarefa; mudar de assunto a encerra.
   */
  const selectRow = (rowId: string) => {
    setTargetRowId(null);
    selection.selectRow(rowId);
  };
  const selectBlock = (blockId: string) => {
    setTargetRowId(null);
    selection.selectBlock(blockId);
  };
  const clearSelection = () => {
    setTargetRowId(null);
    selection.clear();
  };

  // `app-editor` não é decoração: é onde moram as medidas que as três regiões
  // precisam concordar (altura da barra fixa, respiro da página, faixa do
  // topnav). Ver `.app-editor` em `src/app/index.css`.
  return (
    <VStack gap={4} className="app-editor">
      <DashboardBreadcrumbs
        title={detail.title}
        dashboardId={detail.id}
        current="Editar"
      />

      <VStack gap={1}>
        <Heading level={2}>Editar dashboard</Heading>
        {/* Só a regra que a tela não conta em outro lugar. O "clique em um
            bloco para editá-lo" que ficava aqui está no rodapé do inspetor,
            junto do controle que ele explica — dizer a mesma coisa duas vezes
            na mesma tela custa altura e não ensina ninguém duas vezes. */}
        <Text type="supporting">
          Nada chega a quem consome o dashboard até você publicar.
        </Text>
      </VStack>

      <EditorToolbar
        dashboardId={detail.id}
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

      {/* Canvas e inspetor: duas regiões de larguras DIFERENTES (o canvas é a
          tarefa, o inspetor é o apoio), o que um grid de colunas iguais não
          expressa — daí a classe de composição no CSS do app. */}
      <HStack gap={5} vAlign="start" className="app-editor-shell">
        <VStack gap={4} className="app-editor-canvas">
          <EditorCanvas
            layout={canvasLayout}
            rows={visibleRows}
            data={preview.data}
            mode={preview.mode}
            onModeChange={preview.setMode}
            isPublished={isPublished}
            hasUnsavedChanges={draft.isDirty}
            activeTabId={activeTabId}
            onTabChange={setRequestedTabId}
            selectedRowId={selectedRow?.id ?? null}
            selectedBlockId={selectedBlock?.block.id ?? null}
            onSelectRow={selectRow}
            onSelectBlock={selectBlock}
            onAddRow={() =>
              draft.updateLayout((current) =>
                addRow(current, undefined, activeTabId ?? undefined),
              )
            }
            onAddChartToRow={openAddChart}
            onMoveRow={(rowId, direction) =>
              draft.updateLayout((current) => moveRow(current, rowId, direction))
            }
            onRemoveRow={(rowId) =>
              draft.updateLayout((current) => removeRow(current, rowId))
            }
            onMoveBlock={(rowId, blockId, direction) =>
              draft.updateLayout((current) =>
                moveBlockWithinRow(current, rowId, blockId, direction),
              )
            }
            onMoveBlockToRow={(blockId, direction) =>
              draft.updateLayout((current) =>
                moveBlockToAdjacentRow(current, blockId, direction),
              )
            }
            onDuplicateBlock={(blockId) =>
              draft.updateLayout((current) => duplicateBlock(current, blockId))
            }
            onRemoveBlock={(blockId) =>
              draft.updateLayout((current) => removeBlock(current, blockId))
            }
          />
        </VStack>

        <EditorInspector
          selection={selection.selection}
          targetName={inspectorTitle({
            selection: selection.selection,
            blockLabel: selectedBlock ? blockDisplayName(selectedBlock.block) : '',
            rowName: selectedRow
              ? rowNameOf(selectedRow, draft.layout.rows.indexOf(selectedRow))
              : '',
            dashboardTitle: draft.title || 'Dashboard sem título',
          })}
          onClear={clearSelection}
        >
          {selectedBlock ? (
            <InspectorBlock
              block={selectedBlock.block}
              filters={draft.layout.filters}
              rowName={rowNameOf(selectedBlock.row, selectedBlock.rowIndex)}
              canMoveLeft={selectedBlock.blockIndex > 0}
              canMoveRight={
                selectedBlock.blockIndex < selectedBlock.row.blocks.length - 1
              }
              canMoveRowUp={selectedBlock.rowIndex > 0}
              canMoveRowDown={selectedBlock.rowIndex < draft.layout.rows.length - 1}
              onMoveWithinRow={(direction) =>
                draft.updateLayout((current) =>
                  moveBlockWithinRow(
                    current,
                    selectedBlock.row.id,
                    selectedBlock.block.id,
                    direction,
                  ),
                )
              }
              onMoveToRow={(direction) =>
                draft.updateLayout((current) =>
                  moveBlockToAdjacentRow(current, selectedBlock.block.id, direction),
                )
              }
              onDuplicate={() =>
                draft.updateLayout((current) =>
                  duplicateBlock(current, selectedBlock.block.id),
                )
              }
              onRemove={() =>
                draft.updateLayout((current) =>
                  removeBlock(current, selectedBlock.block.id),
                )
              }
              onSpanChange={(span) =>
                draft.updateLayout((current) =>
                  setBlockSpan(current, selectedBlock.block.id, span),
                )
              }
              onHeightChange={(height) =>
                draft.updateLayout((current) =>
                  setBlockHeight(current, selectedBlock.block.id, height),
                )
              }
              onTextChange={(field, value) =>
                draft.updateLayout((current) =>
                  setBlockText(current, selectedBlock.block.id, field, value),
                )
              }
              onPropsChange={(patch) =>
                draft.updateLayout((current) =>
                  updateBlockProps(current, selectedBlock.block.id, patch),
                )
              }
              onBindingChange={(binding) =>
                draft.updateLayout((current) =>
                  setBlockDataBinding(current, selectedBlock.block.id, binding),
                )
              }
            />
          ) : selectedRow ? (
            <InspectorRow
              row={selectedRow}
              index={draft.layout.rows.indexOf(selectedRow)}
              tabs={tabs}
              tabId={tabOfRow(tabs, selectedRow.id)}
              canMoveUp={visibleRows.findIndex((row) => row.id === selectedRow.id) > 0}
              canMoveDown={
                visibleRows.findIndex((row) => row.id === selectedRow.id) <
                visibleRows.length - 1
              }
              onTitleChange={(title) =>
                draft.updateLayout((current) =>
                  setRowTitle(current, selectedRow.id, title),
                )
              }
              onHeightChange={(height) =>
                draft.updateLayout((current) =>
                  setRowHeight(current, selectedRow.id, height),
                )
              }
              onTabChange={(tabId) =>
                draft.updateLayout((current) => setRowTab(current, selectedRow.id, tabId))
              }
              onMove={(direction) =>
                draft.updateLayout((current) =>
                  moveRow(current, selectedRow.id, direction),
                )
              }
              onRemove={() =>
                draft.updateLayout((current) => removeRow(current, selectedRow.id))
              }
              onSelectBlock={selectBlock}
              onAddChart={() => openAddChart(selectedRow.id)}
            />
          ) : (
            <InspectorDashboard
              title={draft.title}
              onTitleChange={draft.setTitle}
              filters={draft.layout.filters}
              onAddFilter={() => draft.updateLayout((current) => addFilter(current))}
              onRemoveFilter={(filterId) =>
                draft.updateLayout((current) => removeFilter(current, filterId))
              }
              onUpdateFilter={(filterId, patch) =>
                draft.updateLayout((current) => updateFilter(current, filterId, patch))
              }
              tabs={tabs}
              onAddTab={() => draft.updateLayout((current) => addTab(current))}
              onRenameTab={(tabId, title) =>
                draft.updateLayout((current) => renameTab(current, tabId, title))
              }
              onMoveTab={(tabId, direction) =>
                draft.updateLayout((current) => moveTab(current, tabId, direction))
              }
              onRemoveTab={(tabId) =>
                draft.updateLayout((current) => removeTab(current, tabId))
              }
              rows={draft.layout.rows}
              targetRowId={targetRowId}
              isDirty={draft.isDirty}
              isAddingChart={draft.isAddingChart}
              onAddChart={(input) => {
                draft.addChart(input);
                setTargetRowId(null);
              }}
            />
          )}
        </EditorInspector>
      </HStack>
    </VStack>
  );
}

/** Nome de exibição de uma linha (o título dela, ou a posição). */
function rowNameOf(row: { title?: string }, index: number): string {
  return row.title || `Linha ${index + 1}`;
}

/** Aba dona de uma linha; linha órfã cai na primeira, como faz o normalizador. */
function tabOfRow(tabs: { id: string; rowIds: string[] }[], rowId: string): string {
  return tabs.find((tab) => tab.rowIds.includes(rowId))?.id ?? tabs[0]?.id ?? '';
}

/**
 * Linhas exibidas na aba aberta.
 *
 * A ordem vem de `tab.rowIds` (é ela que a visualização percorre), e as linhas
 * ÓRFÃS — as que nenhuma aba reivindica — entram na primeira aba. É a mesma
 * regra do normalizador do contrato: replicá-la aqui é o preço de trabalhar com
 * o layout de EDIÇÃO (que tem campos que o contrato serializado não carrega),
 * e é por isso que ela está isolada nesta função, com nome, em vez de diluída
 * no meio do render.
 */
function rowsOfTab(
  rows: EditorRow[],
  tabs: { id: string; rowIds: string[] }[],
  activeTabId: string | null,
): EditorRow[] {
  if (tabs.length === 0) return rows;
  const active = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];
  const byId = new Map(rows.map((row) => [row.id, row]));
  const claimed = new Set(tabs.flatMap((tab) => tab.rowIds));
  const ordered = active.rowIds
    .map((rowId) => byId.get(rowId))
    .filter((row): row is EditorRow => Boolean(row));
  if (active.id !== tabs[0].id) return ordered;
  return [...ordered, ...rows.filter((row) => !claimed.has(row.id))];
}

/** Título do painel: o nome do que está selecionado. */
function inspectorTitle({
  selection,
  blockLabel,
  rowName,
  dashboardTitle,
}: {
  selection: { kind: 'dashboard' | 'row' | 'block' };
  blockLabel: string;
  rowName: string;
  dashboardTitle: string;
}): string {
  if (selection.kind === 'block') return blockLabel;
  if (selection.kind === 'row') return rowName;
  return dashboardTitle;
}
