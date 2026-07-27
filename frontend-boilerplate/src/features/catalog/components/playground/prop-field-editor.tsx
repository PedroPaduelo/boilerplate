/**
 * Editor de UMA prop visual do bloco, gerado a partir do `propsSchema`.
 *
 * O tipo do schema decide o controle: enum → `Selector`, boolean → `Switch`,
 * number/integer → `NumberInput`, resto → `TextInput`. Props de cor ganham um
 * tratamento próprio (`ColorPropField`), porque o enum de acento do DS aceita
 * também um valor livre (classe utilitária) para o playground.
 */
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { Selector } from '@astryxdesign/core/Selector';
import { Switch } from '@astryxdesign/core/Switch';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/Layout';
import { ACCENT_COLORS, isAccentColor } from '@/shared/render-engine/lib/accent';
import { isColorProp } from './playground-helpers';
import type { PropField } from './types';

export interface PropFieldEditorProps {
  field: PropField;
  value: unknown;
  onChange: (next: unknown) => void;
}

/** Valor sentinela da opção "Personalizado" do seletor de cor. */
const CUSTOM = '__custom__';

function asString(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}

function ColorPropField({ field, value, onChange }: PropFieldEditorProps) {
  const raw = asString(value);
  const bare = raw.startsWith('bg-') ? raw.slice(3) : raw;
  const isEnumValue = isAccentColor(bare);

  return (
    <VStack gap={1.5}>
      <Selector
        label={field.key}
        size="sm"
        isRequired={field.required}
        description={field.schema.description}
        value={isEnumValue ? bare : CUSTOM}
        options={[
          ...ACCENT_COLORS.map((c) => ({ value: c, label: c })),
          { type: 'divider' as const },
          { value: CUSTOM, label: 'Personalizado…' },
        ]}
        onChange={(next) => onChange(next === CUSTOM ? '' : next)}
      />
      {isEnumValue ? null : (
        <TextInput
          label={`${field.key} — cor personalizada`}
          isLabelHidden
          size="sm"
          value={raw}
          placeholder="ex.: bg-purple-500"
          description="Classe utilitária ou cor CSS aceita pelo bloco."
          onChange={(next) => onChange(next)}
        />
      )}
    </VStack>
  );
}

export function PropFieldEditor({ field, value, onChange }: PropFieldEditorProps) {
  const { key, schema, required } = field;

  if (isColorProp(key, schema)) {
    return <ColorPropField field={field} value={value} onChange={onChange} />;
  }

  if (schema.enum?.length) {
    return (
      <Selector
        label={key}
        size="sm"
        isRequired={required}
        description={schema.description}
        value={asString(value)}
        options={schema.enum.map((opt) => ({ value: String(opt), label: String(opt) }))}
        onChange={onChange}
      />
    );
  }

  if (schema.type === 'boolean') {
    return (
      <Switch
        label={key}
        description={schema.description}
        labelPosition="start"
        labelSpacing="spread"
        value={Boolean(value)}
        onChange={onChange}
      />
    );
  }

  if (schema.type === 'number' || schema.type === 'integer') {
    return (
      <NumberInput
        label={key}
        size="sm"
        isRequired={required}
        description={schema.description}
        value={typeof value === 'number' ? value : Number(value) || 0}
        min={schema.minimum}
        max={schema.maximum}
        isIntegerOnly={schema.type === 'integer'}
        onChange={onChange}
      />
    );
  }

  return (
    <TextInput
      label={key}
      size="sm"
      isRequired={required}
      description={schema.description}
      value={asString(value)}
      onChange={(next) => onChange(next)}
    />
  );
}
