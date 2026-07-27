/**
 * Parâmetros de um `dataBinding`: cada linha liga um FILTRO do dashboard a um
 * ALIAS usado na consulta (`:alias`). É esse vínculo que faz o backend
 * recomputar só os blocos afetados quando o filtro muda.
 *
 * Linha densa e repetida → rótulo acessível numerado + `isLabelHidden`, com o
 * placeholder fazendo o papel visual (mesmo padrão do editor de linhas).
 */
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Selector } from '@astryxdesign/core/Selector';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import type { DashFilter } from '../../lib/dashboard-filters';
import type { EditorBindingParam } from '../../lib/layout-editor';

export interface BindingParamsEditorProps {
  params: EditorBindingParam[];
  /** Filtros disponíveis no layout (origem dos valores). */
  filters: DashFilter[];
  onChange: (params: EditorBindingParam[]) => void;
}

export function BindingParamsEditor({
  params,
  filters,
  onChange,
}: BindingParamsEditorProps) {
  const filterOptions = filters.map((filter) => ({
    value: filter.id,
    label: filter.label || filter.id,
  }));

  const setParam = (index: number, patch: Partial<EditorBindingParam>) =>
    onChange(params.map((param, i) => (i === index ? { ...param, ...patch } : param)));

  return (
    <VStack gap={2}>
      <HStack vAlign="center" hAlign="between" gap={2}>
        <Text type="label">Parâmetros (filtro → alias)</Text>
        <Button
          label="Adicionar parâmetro"
          icon={<Icon icon={Plus} />}
          variant="ghost"
          size="sm"
          onClick={() =>
            onChange([...params, { filterId: filters[0]?.id ?? '', as: '' }])
          }
        />
      </HStack>

      {params.length === 0 ? (
        <Text type="supporting">
          Sem parâmetros — a consulta deste bloco não reage a nenhum filtro.
        </Text>
      ) : (
        params.map((param, index) => (
          <HStack key={index} gap={2} vAlign="end" wrap="wrap">
            <Selector
              label={`Filtro do parâmetro ${index + 1}`}
              isLabelHidden
              size="sm"
              width={180}
              value={param.filterId}
              options={filterOptions}
              placeholder={filters.length === 0 ? 'Nenhum filtro' : 'Filtro'}
              isDisabled={filters.length === 0}
              disabledMessage="Crie um filtro no dashboard para vinculá-lo aqui."
              onChange={(value) => setParam(index, { filterId: value })}
            />
            <TextInput
              label={`Alias do parâmetro ${index + 1}`}
              isLabelHidden
              size="sm"
              width={150}
              placeholder="alias (as)"
              value={param.as}
              onChange={(value) => setParam(index, { as: value })}
            />
            <IconButton
              label={`Remover parâmetro ${index + 1}`}
              tooltip="Remover parâmetro"
              icon={<Icon icon={Trash2} />}
              variant="ghost"
              size="sm"
              onClick={() => onChange(params.filter((_, i) => i !== index))}
            />
          </HStack>
        ))
      )}
    </VStack>
  );
}
