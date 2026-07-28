/**
 * Form ENXUTO do `dataBinding` de um bloco. Sem query-builder visual:
 * connectionId + SQL + params (filtro → alias) + transform + ttl.
 *
 * O contrato (doc 20) exige `connectionId` e `query`. Os campos vazios são
 * MANTIDOS (não removidos do payload) para que `validateLayoutForSave` aponte o
 * problema no salvar; o `status` de erro só antecipa esse aviso para o próprio
 * campo, em vez de deixar o usuário caçar qual bloco quebrou o layout.
 *
 * `ttlSeconds = 0` = bloco tempo-real (sem cache no executor).
 */
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { FormLayout } from '@astryxdesign/core/FormLayout';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, Section, VStack } from '@astryxdesign/core/Layout';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import type { DashFilter } from '../../lib/dashboard-filters';
import type { EditorDataBinding } from '../../lib/layout-editor';
import { BindingParamsEditor } from './binding-params-editor';
import { requiredFieldStatus } from './editor-fields';

export interface DataBindingFormProps {
  blockId: string;
  binding: EditorDataBinding | undefined;
  filters: DashFilter[];
  onChange: (binding: EditorDataBinding | undefined) => void;
}

export function DataBindingForm({
  blockId,
  binding,
  filters,
  onChange,
}: DataBindingFormProps) {
  if (!binding) {
    return (
      <HStack gap={2}>
        <Button
          label="Adicionar fonte de dados"
          icon={<Icon icon={Plus} />}
          size="sm"
          onClick={() => onChange({ connectionId: '', query: '' })}
        />
      </HStack>
    );
  }

  const patch = (partial: Partial<EditorDataBinding>) =>
    onChange({ ...binding, ...partial });

  return (
    <Section
      variant="muted"
      padding={3}
      data-binding-of={blockId}
      aria-label="Fonte de dados do bloco"
    >
      <VStack gap={3}>
        <TextInput
          label="Conexão (connectionId)"
          size="sm"
          placeholder="conn_xxxxx"
          value={binding.connectionId}
          status={requiredFieldStatus(binding.connectionId)}
          onChange={(value) => patch({ connectionId: value })}
        />

        <TextArea
          className="app-code-field"
          label="Consulta SQL (somente leitura)"
          size="sm"
          rows={4}
          hasSpellCheck={false}
          placeholder="SELECT ..."
          value={binding.query}
          status={requiredFieldStatus(binding.query)}
          onChange={(value) => patch({ query: value })}
        />

        <BindingParamsEditor
          params={binding.params ?? []}
          filters={filters}
          onChange={(params) => patch({ params })}
        />

        <FormLayout direction="horizontal">
          <TextInput
            label="Transform"
            size="sm"
            isOptional
            placeholder="ex.: scalar"
            value={typeof binding.transform === 'string' ? binding.transform : ''}
            onChange={(value) => patch({ transform: value })}
          />
          <NumberInput
            label="TTL (segundos)"
            size="sm"
            isOptional
            min={0}
            isIntegerOnly
            hasClear
            placeholder="3600"
            description="0 = tempo real (sem cache)."
            value={binding.ttlSeconds ?? null}
            onChange={(value: number | null) => patch({ ttlSeconds: value ?? undefined })}
          />
        </FormLayout>

        <HStack gap={2}>
          <Button
            label="Remover fonte de dados"
            icon={<Icon icon={Trash2} />}
            variant="ghost"
            size="sm"
            onClick={() => onChange(undefined)}
          />
        </HStack>
      </VStack>
    </Section>
  );
}
