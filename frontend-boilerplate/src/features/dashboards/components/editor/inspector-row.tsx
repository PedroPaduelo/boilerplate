/**
 * INSPETOR DE LINHA — nome, aba, altura e o que a linha contém.
 *
 * A altura mora AQUI, e não no bloco, porque a linha é a unidade de decisão de
 * altura do motor: ela escolhe um tamanho e todos os seus blocos ficam com ele.
 * É essa regra que impede o defeito clássico de dashboard montado à mão — um
 * gráfico terminando 40px mais alto que o vizinho, sem ninguém ter pedido.
 * O bloco também tem um campo de altura, mas como EXCEÇÃO explícita.
 *
 * A lista de blocos no fim não é decoração: é a forma de pular para um bloco
 * sem caçá-lo no canvas — o mesmo papel do "content outline" do Grafana, na
 * escala que este editor precisa.
 */
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { Divider } from '@astryxdesign/core/Divider';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { List, ListItem } from '@astryxdesign/core/List';
import { Selector } from '@astryxdesign/core/Selector';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { getBlock } from '@/shared/render-engine';
import type {
  BlockHeight,
  EditorRow,
  EditorTab,
  MoveDirection,
} from '../../lib/layout-editor';
import { blockLabelOf, heightSummary } from './editor-fields';
import { HeightField } from './height-field';

export interface InspectorRowProps {
  row: EditorRow;
  index: number;
  tabs: EditorTab[];
  /** Aba dona da linha (vazio quando o dashboard não usa abas). */
  tabId: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onTitleChange: (title: string) => void;
  onHeightChange: (height: BlockHeight | undefined) => void;
  onTabChange: (tabId: string) => void;
  onMove: (direction: MoveDirection) => void;
  onRemove: () => void;
  onSelectBlock: (blockId: string) => void;
  onAddChart: () => void;
}

export function InspectorRow({
  row,
  index,
  tabs,
  tabId,
  canMoveUp,
  canMoveDown,
  onTitleChange,
  onHeightChange,
  onTabChange,
  onMove,
  onRemove,
  onSelectBlock,
  onAddChart,
}: InspectorRowProps) {
  const name = row.title || `Linha ${index + 1}`;

  return (
    <VStack gap={4}>
      <VStack gap={3}>
        {/* Sem `isOptional` — ver a nota em `inspector-block`: o rótulo do DS
            sairia com um "Optional" em inglês no meio da tela. */}
        <TextInput
          label="Título da linha"
          size="sm"
          width="100%"
          placeholder={`Linha ${index + 1}`}
          description="Opcional — aparece como cabeçalho da faixa no dashboard."
          value={row.title ?? ''}
          onChange={onTitleChange}
        />

        {tabs.length > 0 ? (
          <Selector
            label="Aba"
            size="sm"
            width="100%"
            value={tabId}
            options={tabs.map((tab) => ({ value: tab.id, label: tab.title }))}
            description="Em qual aba esta linha aparece."
            onChange={onTabChange}
          />
        ) : null}

        <HeightField
          label="Altura da linha"
          value={row.height}
          inheritLabel="Automática (pelo tipo dos blocos)"
          inheritDescription={`Em vigor agora: ${heightSummary(row.height, row.blocks)}.`}
          onChange={onHeightChange}
        />
      </VStack>

      <Divider />

      <VStack gap={2}>
        <HStack gap={2} vAlign="center" hAlign="between">
          <Text type="label">Blocos desta linha</Text>
          <Button label="Adicionar" size="sm" variant="ghost" onClick={onAddChart} />
        </HStack>

        {row.blocks.length === 0 ? (
          <Text type="supporting">Nenhum bloco ainda.</Text>
        ) : (
          <List>
            {row.blocks.map((block) => (
              <ListItem
                key={block.id}
                label={blockLabelOf(block)}
                description={getBlock(block.type)?.manifest.name ?? block.type}
                onClick={() => onSelectBlock(block.id)}
              />
            ))}
          </List>
        )}
      </VStack>

      <Divider />

      <VStack gap={2}>
        <Text type="label">Posição</Text>
        <HStack gap={2} wrap="wrap">
          <Button
            label="Subir"
            icon={<Icon icon={ArrowUp} />}
            variant="secondary"
            size="sm"
            isDisabled={!canMoveUp}
            tooltip={canMoveUp ? undefined : 'Já é a primeira linha.'}
            onClick={() => onMove('up')}
          />
          <Button
            label="Descer"
            icon={<Icon icon={ArrowDown} />}
            variant="secondary"
            size="sm"
            isDisabled={!canMoveDown}
            tooltip={canMoveDown ? undefined : 'Já é a última linha.'}
            onClick={() => onMove('down')}
          />
          <Button
            label="Remover linha"
            icon={<Icon icon={Trash2} />}
            variant="destructive"
            size="sm"
            tooltip={`Remove a ${name.toLowerCase()} e os blocos dela`}
            onClick={onRemove}
          />
        </HStack>
      </VStack>
    </VStack>
  );
}
