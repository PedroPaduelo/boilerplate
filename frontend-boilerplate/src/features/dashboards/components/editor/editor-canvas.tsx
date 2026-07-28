/**
 * CANVAS do editor — o dashboard de verdade, editável no lugar.
 *
 * Substitui a coluna de formulários do editor antigo. A diferença não é
 * estética: antes, montar um dashboard exigia manter na cabeça a tradução entre
 * uma lista de cards de formulário ("bloco b-kpi-msgs, largura 3") e o
 * resultado numa coluna estreita ao lado. Medido na tela: 2557px de rolagem de
 * formulário para um dashboard de 9 blocos, com o preview de 792px de largura
 * mostrando duas colunas onde a tela real mostra três. O canvas elimina a
 * tradução — e, por ser o mesmo renderer, também a divergência.
 *
 * ABAS: o canvas edita UMA aba por vez, como a tela de visualização exibe. O
 * preview antigo achatava todas as linhas numa lista só, o que tornava
 * impossível conferir a divisão que o usuário acabara de criar. Aqui, trocar de
 * aba no editor mostra exatamente o que o leitor verá naquela aba — e a linha
 * nova nasce na aba aberta, em vez de ir sempre para a primeira.
 *
 * MODO DE DADOS: o alternador rascunho/publicado continua sendo o mesmo
 * conceito do preview antigo, com uma regra a mais — na versão publicada o
 * canvas fica SOMENTE LEITURA. Editar o que já está publicado é uma
 * contradição: as alterações vão para o rascunho, e deixar os controles
 * habilitados ali prometeria uma edição que não existe.
 */
import { Eye, Plus } from 'lucide-react';
import type { DashboardDataPayload } from '@dashboards/contracts';
import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import {
  SegmentedControl,
  SegmentedControlItem,
} from '@astryxdesign/core/SegmentedControl';
import { Text } from '@astryxdesign/core/Text';
import { Toolbar } from '@astryxdesign/core/Toolbar';
import type { ApiMode } from '@/shared/lib/query-keys';
import type { EditorLayout, EditorRow, MoveDirection } from '../../lib/layout-editor';
import { CanvasRow } from './canvas-row';

export interface EditorCanvasProps {
  layout: EditorLayout;
  /** Linhas da aba aberta, na ordem em que a aba as exibe. */
  rows: EditorRow[];
  data: DashboardDataPayload | undefined;
  mode: ApiMode;
  onModeChange: (mode: ApiMode) => void;
  /** Há uma versão publicada com que comparar. */
  isPublished: boolean;
  /** Há edição local não salva (os DADOS do preview vêm do rascunho salvo). */
  hasUnsavedChanges: boolean;
  activeTabId: string | null;
  onTabChange: (tabId: string) => void;
  selectedRowId: string | null;
  selectedBlockId: string | null;
  onSelectRow: (rowId: string) => void;
  onSelectBlock: (blockId: string) => void;
  onAddRow: () => void;
  onAddChartToRow: (rowId: string) => void;
  onMoveRow: (rowId: string, direction: MoveDirection) => void;
  onRemoveRow: (rowId: string) => void;
  onMoveBlock: (rowId: string, blockId: string, direction: MoveDirection) => void;
  onMoveBlockToRow: (blockId: string, direction: MoveDirection) => void;
  onDuplicateBlock: (blockId: string) => void;
  onRemoveBlock: (blockId: string) => void;
}

/** Um aviso por vez, do mais acionável para o mais informativo. */
function dataHint(
  mode: ApiMode,
  isPublished: boolean,
  hasUnsavedChanges: boolean,
): string | null {
  if (mode === 'published') {
    return 'Você está vendo a versão no ar (somente leitura). As edições acontecem no rascunho.';
  }
  if (hasUnsavedChanges) {
    return 'Os números vêm do rascunho salvo. Salve para atualizá-los — o layout já reflete suas alterações.';
  }
  if (!isPublished) {
    return 'Publique o dashboard para comparar com a versão publicada.';
  }
  return null;
}

export function EditorCanvas({
  layout,
  rows,
  data,
  mode,
  onModeChange,
  isPublished,
  hasUnsavedChanges,
  activeTabId,
  onTabChange,
  selectedRowId,
  selectedBlockId,
  onSelectRow,
  onSelectBlock,
  onAddRow,
  onAddChartToRow,
  onMoveRow,
  onRemoveRow,
  onMoveBlock,
  onMoveBlockToRow,
  onDuplicateBlock,
  onRemoveBlock,
}: EditorCanvasProps) {
  const tabs = layout.tabs ?? [];
  const isEditable = mode === 'draft';
  const hint = dataHint(mode, isPublished, hasUnsavedChanges);

  const addRowButton = (
    <Button
      label="Adicionar linha"
      icon={<Icon icon={Plus} />}
      size="sm"
      isDisabled={!isEditable}
      tooltip={isEditable ? undefined : 'Volte para o rascunho para editar.'}
      onClick={onAddRow}
    />
  );

  return (
    <VStack gap={3}>
      <Toolbar
        label="Área de montagem do dashboard"
        size="sm"
        dividers={['bottom']}
        startContent={
          tabs.length > 0 ? (
            <SegmentedControl
              label="Aba em edição"
              size="sm"
              value={activeTabId ?? tabs[0]?.id ?? ''}
              onChange={onTabChange}
            >
              {tabs.map((tab) => (
                <SegmentedControlItem key={tab.id} value={tab.id} label={tab.title} />
              ))}
            </SegmentedControl>
          ) : (
            <HStack gap={2} vAlign="center">
              <Icon icon={Eye} size="sm" />
              <Text type="label">Montagem</Text>
            </HStack>
          )
        }
        endContent={
          /* "Em edição" / "No ar", e não "Rascunho" / "Publicado": esses dois
             já nomeiam o ESTADO do dashboard no badge da barra de ações, e
             repeti-los aqui com outro significado (a versão que o canvas
             mostra) faria a mesma palavra dizer duas coisas na mesma tela. */
          <SegmentedControl
            label="Versão exibida no canvas"
            size="sm"
            value={mode}
            onChange={(value) => onModeChange(value as ApiMode)}
          >
            <SegmentedControlItem value="draft" label="Em edição" />
            <SegmentedControlItem
              value="published"
              label="No ar"
              isDisabled={!isPublished}
            />
          </SegmentedControl>
        }
      />

      {hint ? <Text type="supporting">{hint}</Text> : null}

      {rows.length === 0 ? (
        <EmptyState
          headingLevel={3}
          icon={<Icon icon={Eye} size="lg" />}
          title={
            tabs.length > 0 ? 'Esta aba ainda não tem conteúdo' : 'Dashboard sem linhas'
          }
          description="Crie uma linha para posicionar blocos, ou adicione um gráfico que já existe."
          actions={addRowButton}
        />
      ) : (
        <VStack gap={6}>
          {rows.map((row, index) => (
            <CanvasRow
              key={row.id}
              row={row}
              index={index}
              data={data}
              isEditable={isEditable}
              isSelected={selectedRowId === row.id}
              selectedBlockId={selectedBlockId}
              canMoveUp={index > 0}
              canMoveDown={index < rows.length - 1}
              onSelectRow={() => onSelectRow(row.id)}
              onSelectBlock={onSelectBlock}
              onMoveRow={(direction) => onMoveRow(row.id, direction)}
              onRemoveRow={() => onRemoveRow(row.id)}
              onMoveBlock={(blockId, direction) =>
                onMoveBlock(row.id, blockId, direction)
              }
              onMoveBlockToRow={onMoveBlockToRow}
              onDuplicateBlock={onDuplicateBlock}
              onRemoveBlock={onRemoveBlock}
              onAddChartHere={() => onAddChartToRow(row.id)}
            />
          ))}
        </VStack>
      )}

      {rows.length > 0 ? <HStack gap={2}>{addRowButton}</HStack> : null}
    </VStack>
  );
}
