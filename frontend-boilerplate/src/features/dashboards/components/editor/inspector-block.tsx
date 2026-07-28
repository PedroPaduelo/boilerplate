/**
 * INSPETOR DE BLOCO — tudo o que se pode dizer sobre um bloco, num lugar só.
 *
 * A ordem dos campos é a ordem das perguntas que quem monta um dashboard faz,
 * da mais frequente para a mais rara:
 *
 *   1. como este card se chama       (título/subtítulo)
 *   2. que espaço ele ocupa          (largura e altura)
 *   3. de onde vêm os números        (fonte de dados)
 *   4. onde ele fica                 (mover, duplicar, remover)
 *
 * O que NÃO está aqui é tão decidido quanto o que está: nada de `id`, `type` ou
 * `rowSpan` em campo editável. São dados de identidade e de composição — mudá-los
 * pela lateral quebra referências (o `id` é a chave por onde os dados chegam)
 * sem que a tela tenha como explicar o estrago.
 */
import { Badge } from '@astryxdesign/core/Badge';
import { Divider } from '@astryxdesign/core/Divider';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Selector } from '@astryxdesign/core/Selector';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { getBlock } from '@/shared/render-engine';
import type { DashFilter } from '../../lib/dashboard-filters';
import type {
  BlockHeight,
  EditorBlock,
  EditorDataBinding,
  MoveDirection,
} from '../../lib/layout-editor';
import { BlockActions } from './block-actions';
import { BlockContentFields } from './block-content-fields';
import {
  WIDTH_OPTIONS,
  blockLabelOf,
  spanForWidthOption,
  widthOptionOf,
} from './editor-fields';
import { HeightField } from './height-field';

export interface InspectorBlockProps {
  block: EditorBlock;
  filters: DashFilter[];
  /** Nome da linha que contém o bloco — situa a pessoa no dashboard. */
  rowName: string;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  canMoveRowUp: boolean;
  canMoveRowDown: boolean;
  onMoveWithinRow: (direction: MoveDirection) => void;
  onMoveToRow: (direction: MoveDirection) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onSpanChange: (span: number) => void;
  onHeightChange: (height: BlockHeight | undefined) => void;
  onTextChange: (field: 'title' | 'subtitle', value: string) => void;
  onPropsChange: (patch: Record<string, unknown>) => void;
  onBindingChange: (binding: EditorDataBinding | undefined) => void;
}

export function InspectorBlock({
  block,
  filters,
  rowName,
  canMoveLeft,
  canMoveRight,
  canMoveRowUp,
  canMoveRowDown,
  onMoveWithinRow,
  onMoveToRow,
  onDuplicate,
  onRemove,
  onSpanChange,
  onHeightChange,
  onTextChange,
  onPropsChange,
  onBindingChange,
}: InspectorBlockProps) {
  const definition = getBlock(block.type);
  const typeName = definition?.manifest.name ?? block.type;
  // Só blocos emoldurados têm cabeçalho de card. Oferecer "título do card" para
  // um bloco narrativo (que É o texto) seria um campo sem efeito visível.
  const hasCardHeader = definition?.manifest.kind === 'chart';

  return (
    <VStack gap={4}>
      <VStack gap={1}>
        <HStack gap={2} vAlign="center" wrap="wrap">
          <Badge label={typeName} />
          <Text type="supporting">em {rowName}</Text>
        </HStack>
        <Text type="code" color="secondary">
          {block.id}
        </Text>
      </VStack>

      {hasCardHeader ? (
        <VStack gap={3}>
          {/* Sem `isOptional`: o design system escreve "Optional" em inglês,
              cravado no componente (não passa pelo catálogo de i18n). Num
              produto em português a opcionalidade vai no texto de apoio. */}
          <TextInput
            label="Título do card"
            size="sm"
            width="100%"
            placeholder={typeName}
            description="Opcional — vazio usa o nome do tipo de bloco."
            value={block.title ?? ''}
            onChange={(value) => onTextChange('title', value)}
          />
          <TextInput
            label="Subtítulo"
            size="sm"
            width="100%"
            placeholder="Linha de apoio no cabeçalho (opcional)"
            value={block.subtitle ?? ''}
            onChange={(value) => onTextChange('subtitle', value)}
          />
        </VStack>
      ) : null}

      <Divider />

      <VStack gap={3}>
        <Text type="label">Tamanho</Text>
        <Selector
          label="Largura"
          size="sm"
          width="100%"
          value={widthOptionOf(block.span)}
          options={WIDTH_OPTIONS}
          description="Blocos que dividem a linha recebem faixas iguais."
          onChange={(value) => onSpanChange(spanForWidthOption(value))}
        />
        <HeightField
          label="Altura do bloco"
          value={block.height}
          inheritLabel="Herdar da linha"
          inheritDescription="A linha decide — é o que mantém os vizinhos do mesmo tamanho."
          onChange={onHeightChange}
        />
      </VStack>

      <Divider />

      <VStack gap={3}>
        <Text type="label">Conteúdo</Text>
        <BlockContentFields
          block={block}
          filters={filters}
          onPropsChange={onPropsChange}
          onBindingChange={onBindingChange}
        />
      </VStack>

      <Divider />

      <VStack gap={2}>
        <Text type="label">Posição</Text>
        <BlockActions
          blockLabel={blockLabelOf(block)}
          canMoveLeft={canMoveLeft}
          canMoveRight={canMoveRight}
          canMoveRowUp={canMoveRowUp}
          canMoveRowDown={canMoveRowDown}
          onMoveLeft={() => onMoveWithinRow('up')}
          onMoveRight={() => onMoveWithinRow('down')}
          onMoveRowUp={() => onMoveToRow('up')}
          onMoveRowDown={() => onMoveToRow('down')}
          onDuplicate={onDuplicate}
          onRemove={onRemove}
        />
        <Text type="supporting">
          Mover, duplicar e remover — as mesmas ações que aparecem sobre o bloco no
          canvas.
        </Text>
      </VStack>
    </VStack>
  );
}
