/**
 * Card de edição de UM bloco — editor ENXUTO, SEM drag-and-drop.
 *
 * Aqui o card se justifica (ao contrário das linhas, que são `Section`): o
 * bloco É um item discreto, que pode ser reordenado ou removido sozinho.
 *
 * Cabeçalho: tipo (badge) + id, e as ações de posição à direita. Depois a
 * largura (span 1..12) e, por último, o conteúdo específico do tipo —
 * delegado a `BlockContentFields`.
 */
import { Badge } from '@astryxdesign/core/Badge';
import { Card } from '@astryxdesign/core/Card';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { Text } from '@astryxdesign/core/Text';
import type { DashFilter } from '../../lib/dashboard-filters';
import type { EditorBlock, EditorDataBinding } from '../../lib/layout-editor';
import { BlockContentFields } from './block-content-fields';
import { BlockMoveActions } from './block-move-actions';
import { SPAN_MAX, SPAN_MIN } from './editor-fields';

export interface BlockEditorCardProps {
  block: EditorBlock;
  filters: DashFilter[];
  canMoveUp: boolean;
  canMoveDown: boolean;
  canMoveRowUp: boolean;
  canMoveRowDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveRowUp: () => void;
  onMoveRowDown: () => void;
  onRemove: () => void;
  onSpanChange: (span: number) => void;
  onPropsChange: (patch: Record<string, unknown>) => void;
  onBindingChange: (binding: EditorDataBinding | undefined) => void;
}

export function BlockEditorCard({
  block,
  filters,
  canMoveUp,
  canMoveDown,
  canMoveRowUp,
  canMoveRowDown,
  onMoveUp,
  onMoveDown,
  onMoveRowUp,
  onMoveRowDown,
  onRemove,
  onSpanChange,
  onPropsChange,
  onBindingChange,
}: BlockEditorCardProps) {
  return (
    <Card padding={3} data-block-id={block.id} data-block-type={block.type}>
      <VStack gap={3}>
        <HStack gap={2} vAlign="center" hAlign="between" wrap="wrap">
          <HStack gap={2} vAlign="center">
            <Badge label={block.type} />
            <Text type="supporting">{block.id}</Text>
          </HStack>
          <BlockMoveActions
            blockId={block.id}
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
            canMoveRowUp={canMoveRowUp}
            canMoveRowDown={canMoveRowDown}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onMoveRowUp={onMoveRowUp}
            onMoveRowDown={onMoveRowDown}
            onRemove={onRemove}
          />
        </HStack>

        <NumberInput
          label={`Largura (${SPAN_MIN}–${SPAN_MAX})`}
          size="sm"
          width={150}
          min={SPAN_MIN}
          max={SPAN_MAX}
          isIntegerOnly
          value={block.span}
          onChange={onSpanChange}
        />

        <BlockContentFields
          block={block}
          filters={filters}
          onPropsChange={onPropsChange}
          onBindingChange={onBindingChange}
        />
      </VStack>
    </Card>
  );
}
