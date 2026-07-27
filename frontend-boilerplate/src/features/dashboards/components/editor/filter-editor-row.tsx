/**
 * UM filtro do dashboard em edição: rótulo, id, tipo e valor padrão.
 *
 * O `id` é editável porque é ele que os `dataBinding.params` dos blocos
 * referenciam — é a chave do vínculo, não um detalhe interno. Daí o tooltip no
 * rótulo e o erro inline quando fica vazio (o contrato exige `minLength: 1`).
 */
import { Trash2 } from 'lucide-react';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { HStack } from '@astryxdesign/core/Layout';
import { Selector } from '@astryxdesign/core/Selector';
import { TextInput } from '@astryxdesign/core/TextInput';
import type { DashFilter, DashFilterType } from '../../lib/dashboard-filters';
import { FILTER_TYPE_OPTIONS, requiredFieldStatus } from './editor-fields';

export interface FilterEditorRowProps {
  filter: DashFilter;
  /** Posição na lista — usada nos rótulos de fallback (filtro ainda sem nome). */
  index: number;
  onRemove: (filterId: string) => void;
  onUpdate: (filterId: string, patch: Partial<DashFilter>) => void;
}

export function FilterEditorRow({
  filter,
  index,
  onRemove,
  onUpdate,
}: FilterEditorRowProps) {
  const name = filter.label || filter.id || `Filtro ${index + 1}`;

  return (
    <HStack gap={2} vAlign="end" wrap="wrap" data-filter-id={filter.id}>
      {/* O contrato aceita rótulo vazio (só o `id` tem minLength), então aqui
          não há status de erro — o placeholder mostra o que o usuário veria. */}
      <TextInput
        label="Rótulo"
        size="sm"
        width={170}
        value={filter.label}
        placeholder={`Filtro ${index + 1}`}
        onChange={(value) => onUpdate(filter.id, { label: value })}
      />
      <TextInput
        label="id"
        size="sm"
        width={160}
        value={filter.id}
        labelTooltip="Identificador usado pelos parâmetros dos blocos."
        status={requiredFieldStatus(filter.id)}
        onChange={(value) => onUpdate(filter.id, { id: value })}
      />
      <Selector
        label="Tipo"
        size="sm"
        width={170}
        value={filter.type}
        options={FILTER_TYPE_OPTIONS}
        onChange={(value) => onUpdate(filter.id, { type: value as DashFilterType })}
      />
      <TextInput
        label="Padrão"
        size="sm"
        width={150}
        isOptional
        placeholder="(opcional)"
        value={typeof filter.default === 'string' ? filter.default : ''}
        onChange={(value) =>
          onUpdate(filter.id, { default: value === '' ? undefined : value })
        }
      />
      <IconButton
        label={`Remover filtro ${name}`}
        tooltip="Remover filtro"
        icon={<Icon icon={Trash2} />}
        variant="ghost"
        size="sm"
        onClick={() => onRemove(filter.id)}
      />
    </HStack>
  );
}
