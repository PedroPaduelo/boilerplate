/**
 * Uma LINHA no canvas do editor: uma faixa de cabeçalho fina + a grade de
 * blocos de verdade (`BlockGrid`, o mesmo do dashboard publicado).
 *
 * Usar o `BlockGrid` aqui, e não uma grade própria, é o que garante fidelidade:
 * a altura declarada, o número de colunas e o colapso responsivo são calculados
 * pelo MESMO código que roda na tela final. Um canvas que desenha uma grade
 * "parecida" é um canvas que mente — e a mentira só aparece depois de publicar.
 *
 * O cabeçalho é deliberadamente discreto (texto de apoio, não um card): quem
 * tem que se destacar na tela é o conteúdo do dashboard. Ele mostra o que a
 * linha É (nome, quantidade de blocos, altura em vigor) e carrega as ações que
 * pertencem à linha — reordenar e remover.
 */
import { Plus } from 'lucide-react';
import type { Block, DashboardDataPayload } from '@dashboards/contracts';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { BlockGrid } from '@/shared/render-engine';
import type { EditorBlock, EditorRow } from '../../lib/layout-editor';
import { CanvasBlock } from './canvas-block';
import { blockLabelOf, heightSummary } from './editor-fields';

export interface CanvasRowProps {
  row: EditorRow;
  index: number;
  data: DashboardDataPayload | undefined;
  isSelected: boolean;
  isEditable: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  selectedBlockId: string | null;
  onSelectRow: () => void;
  onSelectBlock: (blockId: string) => void;
  onMoveRow: (direction: 'up' | 'down') => void;
  onRemoveRow: () => void;
  onMoveBlock: (blockId: string, direction: 'up' | 'down') => void;
  onMoveBlockToRow: (blockId: string, direction: 'up' | 'down') => void;
  onDuplicateBlock: (blockId: string) => void;
  onRemoveBlock: (blockId: string) => void;
  /** Abre o formulário de inserção já apontando para esta linha. */
  onAddChartHere: () => void;
}

export function CanvasRow({
  row,
  index,
  data,
  isSelected,
  isEditable,
  canMoveUp,
  canMoveDown,
  selectedBlockId,
  onSelectRow,
  onSelectBlock,
  onMoveRow,
  onRemoveRow,
  onMoveBlock,
  onMoveBlockToRow,
  onDuplicateBlock,
  onRemoveBlock,
  onAddChartHere,
}: CanvasRowProps) {
  const name = row.title || `Linha ${index + 1}`;
  const blocks = row.blocks;

  return (
    <VStack
      gap={2}
      as="section"
      aria-label={name}
      data-row-id={row.id}
      className="app-canvas-row"
      data-selected={isSelected ? 'true' : undefined}
    >
      <HStack gap={2} vAlign="center" hAlign="between" wrap="wrap">
        <HStack gap={2} vAlign="center">
          {/*
            O nome da linha é um BOTÃO, não um título: clicar nele é a forma de
            trazer a linha para o inspetor. Como o texto continua sendo o rótulo
            visível da região, quem navega por teclado chega nele na ordem
            natural — sem um alvo invisível no meio do canvas.
          */}
          <Button
            label={name}
            variant="ghost"
            size="sm"
            isDisabled={!isEditable}
            onClick={onSelectRow}
          />
          <Text type="supporting">
            {blocks.length === 1 ? '1 bloco' : `${blocks.length} blocos`} ·{' '}
            {heightSummary(row.height, blocks)}
          </Text>
        </HStack>

        {isEditable ? (
          <HStack gap={0.5} vAlign="center">
            <Button
              label="Adicionar gráfico"
              icon={<Icon icon={Plus} />}
              variant="ghost"
              size="sm"
              onClick={onAddChartHere}
            />
            <IconButton
              label={`Mover a ${name.toLowerCase()} para cima`}
              tooltip={canMoveUp ? 'Mover linha para cima' : 'Já é a primeira linha.'}
              icon={<Icon icon={ArrowUp} />}
              variant="ghost"
              size="sm"
              isDisabled={!canMoveUp}
              onClick={() => onMoveRow('up')}
            />
            <IconButton
              label={`Mover a ${name.toLowerCase()} para baixo`}
              tooltip={canMoveDown ? 'Mover linha para baixo' : 'Já é a última linha.'}
              icon={<Icon icon={ArrowDown} />}
              variant="ghost"
              size="sm"
              isDisabled={!canMoveDown}
              onClick={() => onMoveRow('down')}
            />
            <IconButton
              label={`Remover a ${name.toLowerCase()}`}
              tooltip="Remover linha (e os blocos dela)"
              icon={<Icon icon={Trash2} />}
              variant="ghost"
              size="sm"
              onClick={onRemoveRow}
            />
          </HStack>
        ) : null}
      </HStack>

      {blocks.length === 0 ? (
        <div className="app-canvas-row__empty">
          <Text type="supporting">
            Linha vazia. Use “Adicionar gráfico” para colocar um bloco aqui.
          </Text>
        </div>
      ) : (
        <BlockGrid
          blocks={blocks as unknown as Block[]}
          rowHeight={row.height}
          slot="editor-canvas-grid"
          cellSlot="editor-canvas-cell"
          renderBlock={(block, declaredHeight) => {
            const editorBlock = block as unknown as EditorBlock;
            const position = blocks.findIndex((item) => item.id === block.id);
            return (
              <CanvasBlock
                block={block}
                label={blockLabelOf(editorBlock)}
                data={data}
                declaredHeight={declaredHeight}
                isEditable={isEditable}
                isSelected={selectedBlockId === block.id}
                onSelect={() => onSelectBlock(block.id)}
                canMoveLeft={position > 0}
                canMoveRight={position < blocks.length - 1}
                canMoveRowUp={canMoveUp}
                canMoveRowDown={canMoveDown}
                onMoveLeft={() => onMoveBlock(block.id, 'up')}
                onMoveRight={() => onMoveBlock(block.id, 'down')}
                onMoveRowUp={() => onMoveBlockToRow(block.id, 'up')}
                onMoveRowDown={() => onMoveBlockToRow(block.id, 'down')}
                onDuplicate={() => onDuplicateBlock(block.id)}
                onRemove={() => onRemoveBlock(block.id)}
              />
            );
          }}
        />
      )}
    </VStack>
  );
}
