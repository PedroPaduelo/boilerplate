/**
 * Conteúdo editável de UM bloco, escolhido pelo tipo:
 *  - narrativo `title`     → texto + nível;
 *  - narrativo `rich_text` → markdown;
 *  - bloco de dados        → form de `dataBinding`.
 *
 * "É bloco de dados?" vem do CATÁLOGO (`manifest.dataContract`, via o registry
 * do render-engine) e não de uma lista de tipos hardcoded — assim um bloco novo
 * no catálogo já nasce editável aqui. O bloco que já tem `dataBinding` também
 * entra, mesmo que o tipo não esteja registrado: o vínculo existe e precisa ser
 * editável para poder ser corrigido.
 */
import { FormLayout } from '@astryxdesign/core/FormLayout';
import { Selector } from '@astryxdesign/core/Selector';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { getBlock } from '@/shared/render-engine';
import type { DashFilter } from '../../lib/dashboard-filters';
import type { EditorBlock, EditorDataBinding } from '../../lib/layout-editor';
import { DataBindingForm } from './data-binding-form';
import { TITLE_LEVEL_OPTIONS } from './editor-fields';

const MARKDOWN_PLACEHOLDER = '## Análise\nTexto em **markdown**…';

export interface BlockContentFieldsProps {
  block: EditorBlock;
  filters: DashFilter[];
  onPropsChange: (patch: Record<string, unknown>) => void;
  onBindingChange: (binding: EditorDataBinding | undefined) => void;
}

export function BlockContentFields({
  block,
  filters,
  onPropsChange,
  onBindingChange,
}: BlockContentFieldsProps) {
  const blockProps = block.props ?? {};

  if (block.type === 'title') {
    return <TitleFields blockProps={blockProps} onChange={onPropsChange} />;
  }

  if (block.type === 'rich_text') {
    return <RichTextFields blockProps={blockProps} onChange={onPropsChange} />;
  }

  const definition = getBlock(block.type);
  const isDataBlock =
    Boolean(definition?.manifest?.dataContract) || Boolean(block.dataBinding);

  if (isDataBlock) {
    return (
      <DataBindingForm
        blockId={block.id}
        binding={block.dataBinding}
        filters={filters}
        onChange={onBindingChange}
      />
    );
  }

  return (
    <Text type="supporting">Este bloco não tem conteúdo editável neste editor.</Text>
  );
}

interface NarrativeFieldsProps {
  blockProps: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}

function TitleFields({ blockProps, onChange }: NarrativeFieldsProps) {
  const text = typeof blockProps.text === 'string' ? blockProps.text : '';
  const level = typeof blockProps.level === 'number' ? String(blockProps.level) : '1';

  return (
    <FormLayout direction="horizontal">
      <TextInput
        label="Texto do título"
        size="sm"
        value={text}
        placeholder="Título da seção"
        onChange={(value) => onChange({ text: value })}
      />
      <Selector
        label="Nível do título"
        size="sm"
        width={110}
        value={level}
        options={TITLE_LEVEL_OPTIONS}
        onChange={(value) => onChange({ level: Number(value) })}
      />
    </FormLayout>
  );
}

function RichTextFields({ blockProps, onChange }: NarrativeFieldsProps) {
  const markdown = typeof blockProps.markdown === 'string' ? blockProps.markdown : '';

  return (
    <TextArea
      label="Markdown"
      size="sm"
      rows={5}
      hasSpellCheck={false}
      value={markdown}
      placeholder={MARKDOWN_PLACEHOLDER}
      onChange={(value) => onChange({ markdown: value })}
    />
  );
}
