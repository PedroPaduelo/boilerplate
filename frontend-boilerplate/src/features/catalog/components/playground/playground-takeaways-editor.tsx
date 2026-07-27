/**
 * Editor das LINHAS DE EXPLICAÇÃO (takeaways) do rodapé do `ChartWidget`.
 *
 * Cada linha tem um interruptor (entra ou não no card) e um texto. "Auto"
 * preenche a partir do `deriveTakeaway` do próprio bloco, quando ele expõe um.
 */
import { Plus, Trash2, Wand2 } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { IconButton } from '@astryxdesign/core/IconButton';
import { HStack, StackItem, VStack } from '@astryxdesign/core/Layout';
import { Icon } from '@astryxdesign/core/Icon';
import { Switch } from '@astryxdesign/core/Switch';
import { Text, Heading } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import type { BlockDefinition } from '@/shared/render-engine';
import type { Takeaway } from './types';

export interface PlaygroundTakeawaysEditorProps {
  definition: BlockDefinition;
  /** Dado atual do preview — entrada do `deriveTakeaway`. */
  data: unknown;
  items: Takeaway[];
  onChange: (next: Takeaway[]) => void;
}

/** Roda o `deriveTakeaway` do bloco e devolve as linhas limpas. */
function derive(definition: BlockDefinition, data: unknown): string[] {
  if (typeof definition.deriveTakeaway !== 'function') return [];
  try {
    const result = definition.deriveTakeaway(data as never);
    const lines = Array.isArray(result) ? result : [result];
    return lines.map((s) => String(s ?? '').trim()).filter((s) => s.length > 0);
  } catch {
    return [];
  }
}

export function PlaygroundTakeawaysEditor({
  definition,
  data,
  items,
  onChange,
}: PlaygroundTakeawaysEditorProps) {
  const canAutoFill = typeof definition.deriveTakeaway === 'function';

  const update = (index: number, partial: Partial<Takeaway>) =>
    onChange(items.map((it, i) => (i === index ? { ...it, ...partial } : it)));

  const autoFill = () => {
    const derived = derive(definition, data);
    if (derived.length === 0) return;
    const filled = items.filter((it) => it.text.trim().length > 0);
    onChange([...filled, ...derived.map((text) => ({ enabled: true, text }))]);
  };

  return (
    <VStack gap={3}>
      <HStack gap={2} justify="between" vAlign="center">
        <Heading level={4}>Insights do rodapé</Heading>
        <HStack gap={1}>
          <Button
            label="Auto"
            variant="ghost"
            size="sm"
            icon={<Icon icon={Wand2} />}
            isDisabled={!canAutoFill}
            tooltip={
              canAutoFill
                ? 'Preenche a partir do insight calculado pelo próprio bloco'
                : 'Este bloco não calcula insights automáticos'
            }
            onClick={autoFill}
          />
          <Button
            label="Adicionar"
            variant="ghost"
            size="sm"
            icon={<Icon icon={Plus} />}
            onClick={() => onChange([...items, { enabled: true, text: '' }])}
          />
        </HStack>
      </HStack>

      {items.length === 0 ? (
        <Text type="supporting">
          Nenhuma linha — o rodapé do card fica só com a query e a duração.
        </Text>
      ) : (
        <VStack gap={2}>
          {items.map((item, index) => (
            <HStack key={`takeaway-${index}`} gap={2} vAlign="center">
              <Switch
                label={`Exibir linha ${index + 1}`}
                isLabelHidden
                value={item.enabled}
                onChange={(enabled) => update(index, { enabled })}
              />
              <StackItem size="fill">
                <TextInput
                  label={`Linha ${index + 1}`}
                  isLabelHidden
                  size="sm"
                  value={item.text}
                  placeholder="Ex.: Maior valor: Jan (R$ 100 mi)"
                  onChange={(text) => update(index, { text })}
                />
              </StackItem>
              <IconButton
                label={`Remover linha ${index + 1}`}
                variant="ghost"
                size="sm"
                tooltip="Remover linha"
                icon={<Icon icon={Trash2} />}
                onClick={() => onChange(items.filter((_, i) => i !== index))}
              />
            </HStack>
          ))}
        </VStack>
      )}
    </VStack>
  );
}
