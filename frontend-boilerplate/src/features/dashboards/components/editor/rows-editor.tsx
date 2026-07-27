/**
 * Edição das LINHAS e dos BLOCOS do layout (sem drag-and-drop, por decisão do
 * MVP: tudo por formulário e botão, o que também é operável por teclado).
 *
 * Cada linha é uma REGIÃO (`Section`), não um card — quem é item discreto aqui
 * é o bloco. Card dentro de card viraria ruído de borda.
 */
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { HStack, Section, VStack } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import type { DashFilter } from '../../lib/dashboard-filters';
import {
  addRow,
  moveBlockToAdjacentRow,
  moveBlockWithinRow,
  removeBlock,
  removeRow,
  setBlockDataBinding,
  setBlockSpan,
  setRowTitle,
  updateBlockProps,
  type EditorLayout,
} from '../../lib/layout-editor';
import { BlockEditorCard } from './block-editor-card';

export interface RowsEditorProps {
  layout: EditorLayout;
  /** Aplica uma transformação PURA (helpers de `lib/layout-editor`) no layout. */
  onLayoutChange: (transform: (layout: EditorLayout) => EditorLayout) => void;
}

export function RowsEditor({ layout, onLayoutChange }: RowsEditorProps) {
  const addRowButton = (
    <Button
      label="Adicionar linha"
      icon={<Icon icon={Plus} />}
      size="sm"
      onClick={() => onLayoutChange((current) => addRow(current))}
    />
  );

  return (
    <VStack gap={3}>
      <HStack vAlign="center" hAlign="between" gap={2}>
        <Text type="label">Linhas e blocos</Text>
        {addRowButton}
      </HStack>

      {layout.rows.length === 0 ? (
        <EmptyState
          isCompact
          headingLevel={4}
          title="Nenhuma linha ainda"
          description="Crie uma linha para posicionar blocos, ou adicione um gráfico existente."
          actions={addRowButton}
        />
      ) : (
        layout.rows.map((row, rowIndex) => (
          <Section
            key={row.id}
            variant="muted"
            padding={3}
            data-row-id={row.id}
            aria-label={row.title || `Linha ${rowIndex + 1}`}
          >
            <VStack gap={3}>
              <HStack gap={2} vAlign="end">
                <TextInput
                  label={`Título da linha ${rowIndex + 1}`}
                  isLabelHidden
                  size="sm"
                  width="100%"
                  placeholder={`Título da linha ${rowIndex + 1} (opcional)`}
                  value={row.title ?? ''}
                  onChange={(value) =>
                    onLayoutChange((current) => setRowTitle(current, row.id, value))
                  }
                />
                <IconButton
                  label={`Remover linha ${rowIndex + 1}`}
                  tooltip="Remover linha"
                  icon={<Icon icon={Trash2} />}
                  variant="ghost"
                  size="sm"
                  onClick={() => onLayoutChange((current) => removeRow(current, row.id))}
                />
              </HStack>

              {row.blocks.length === 0 ? (
                <Text type="supporting">Linha vazia.</Text>
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
                    onMoveUp={() =>
                      onLayoutChange((c) => moveBlockWithinRow(c, row.id, block.id, 'up'))
                    }
                    onMoveDown={() =>
                      onLayoutChange((c) =>
                        moveBlockWithinRow(c, row.id, block.id, 'down'),
                      )
                    }
                    onMoveRowUp={() =>
                      onLayoutChange((c) => moveBlockToAdjacentRow(c, block.id, 'up'))
                    }
                    onMoveRowDown={() =>
                      onLayoutChange((c) => moveBlockToAdjacentRow(c, block.id, 'down'))
                    }
                    onRemove={() => onLayoutChange((c) => removeBlock(c, block.id))}
                    onSpanChange={(span) =>
                      onLayoutChange((c) => setBlockSpan(c, block.id, span))
                    }
                    onPropsChange={(patch) =>
                      onLayoutChange((c) => updateBlockProps(c, block.id, patch))
                    }
                    onBindingChange={(binding) =>
                      onLayoutChange((c) => setBlockDataBinding(c, block.id, binding))
                    }
                  />
                ))
              )}
            </VStack>
          </Section>
        ))
      )}
    </VStack>
  );
}
