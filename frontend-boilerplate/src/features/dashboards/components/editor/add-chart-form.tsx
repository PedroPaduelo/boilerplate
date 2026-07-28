/**
 * Form de `add_chart_to_dashboard` — referencia um Chart que já existe e o
 * insere como bloco no draftLayout via POST /dashboards/:id/blocks (o backend
 * monta o bloco e devolve o dashboard atualizado).
 *
 * Habilitado só quando NÃO há alterações não salvas: a operação aplica sobre o
 * draft do SERVIDOR, então salvar antes evita perder a edição local. O motivo
 * aparece no tooltip do botão e como texto de apoio — o controle continua
 * visível (esconder a ação faria o usuário procurar por ela).
 *
 * Toda a regra (busca do catálogo, opções, montagem do input) mora em
 * `useAddChartForm`; aqui é só apresentação.
 */
import { Plus } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { FormLayout } from '@astryxdesign/core/FormLayout';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Selector } from '@astryxdesign/core/Selector';
import { Text } from '@astryxdesign/core/Text';
import { useAddChartForm } from '../../use-add-chart-form';
import type { EditorRow } from '../../lib/layout-editor';
import type { AddChartInput } from '../../types';
import {
  UNSAVED_CHANGES_HINT,
  WIDTH_OPTIONS,
  spanForWidthOption,
  widthOptionOf,
} from './editor-fields';

export interface AddChartFormProps {
  rows: EditorRow[];
  /** Linha de destino imposta pelo canvas (botão do cabeçalho da linha). */
  lockedRowId?: string | null;
  /** `true` enquanto houver alterações locais não salvas. */
  isDisabled?: boolean;
  /** `true` enquanto a inserção está no ar. */
  isPending?: boolean;
  onAdd: (input: AddChartInput) => void;
}

export function AddChartForm({
  rows,
  lockedRowId = null,
  isDisabled = false,
  isPending = false,
  onAdd,
}: AddChartFormProps) {
  const form = useAddChartForm({ rows, lockedRowId, onAdd });
  const lockedRow = lockedRowId ? rows.find((row) => row.id === lockedRowId) : undefined;
  const lockedRowName = lockedRow
    ? lockedRow.title || `Linha ${rows.indexOf(lockedRow) + 1}`
    : null;

  // Um campo desabilitado sem motivo é um beco sem saída: cada causa possível
  // tem a sua própria explicação, da mais específica para a mais geral.
  const noCharts = !form.isLoadingCharts && !form.hasCharts;
  const isChartFieldDisabled = isDisabled || form.isLoadingCharts || noCharts;
  const chartDisabledMessage = isDisabled
    ? UNSAVED_CHANGES_HINT
    : form.isLoadingCharts
      ? 'Carregando os gráficos disponíveis…'
      : noCharts
        ? 'Nenhum gráfico disponível para adicionar.'
        : undefined;

  const submitDisabledMessage = isDisabled
    ? UNSAVED_CHANGES_HINT
    : !form.canSubmit
      ? 'Escolha um gráfico para adicionar.'
      : undefined;

  return (
    <VStack gap={3}>
      <Text type="label">
        {lockedRowName ? `Adicionar gráfico em ${lockedRowName}` : 'Adicionar gráfico'}
      </Text>

      {chartDisabledMessage ? (
        <Text type="supporting">{chartDisabledMessage}</Text>
      ) : null}

      <FormLayout direction="vertical">
        <Selector
          label="Gráfico a adicionar"
          size="sm"
          width="100%"
          value={form.chartId}
          options={form.chartOptions}
          placeholder={form.isLoadingCharts ? 'Carregando…' : 'Escolha um gráfico'}
          hasSearch
          searchPlaceholder="Buscar gráfico…"
          isDisabled={isChartFieldDisabled}
          disabledMessage={chartDisabledMessage}
          onChange={form.setChartId}
        />
        {lockedRowName ? null : (
          <Selector
            label="Linha de destino"
            size="sm"
            width="100%"
            value={form.rowId}
            options={form.rowOptions}
            isDisabled={isDisabled}
            disabledMessage={isDisabled ? UNSAVED_CHANGES_HINT : undefined}
            onChange={form.setRowId}
          />
        )}
        <Selector
          label="Largura"
          size="sm"
          width="100%"
          value={widthOptionOf(form.span)}
          options={WIDTH_OPTIONS}
          description="Blocos que dividem a linha recebem faixas iguais."
          isDisabled={isDisabled}
          disabledMessage={isDisabled ? UNSAVED_CHANGES_HINT : undefined}
          onChange={(value) => form.setSpan(spanForWidthOption(value))}
        />
      </FormLayout>

      <HStack gap={2}>
        <Button
          label="Adicionar"
          icon={<Icon icon={Plus} />}
          size="sm"
          isLoading={isPending}
          isDisabled={isDisabled || !form.canSubmit}
          tooltip={submitDisabledMessage}
          onClick={form.submit}
        />
      </HStack>
    </VStack>
  );
}
