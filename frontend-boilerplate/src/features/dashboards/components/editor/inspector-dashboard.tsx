/**
 * INSPETOR DO DASHBOARD — o que vale para a página inteira: título, filtros,
 * abas e a inserção de um gráfico que já existe.
 *
 * É o estado PADRÃO do painel (nada selecionado). A ordem segue a frequência
 * real de uso: o título muda uma vez, filtros e abas mudam na montagem, e
 * "adicionar gráfico" é a ação repetida — por isso ela fica por último, perto
 * de onde a mão está quando se está montando, e não perdida no topo.
 */
import { Divider } from '@astryxdesign/core/Divider';
import { VStack } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import type { DashFilter } from '../../lib/dashboard-filters';
import type { EditorRow, EditorTab } from '../../lib/layout-editor';
import type { AddChartInput } from '../../types';
import { AddChartForm } from './add-chart-form';
import { FiltersEditor } from './filters-editor';
import { TabsEditor } from './tabs-editor';

export interface InspectorDashboardProps {
  title: string;
  onTitleChange: (title: string) => void;
  filters: DashFilter[];
  onAddFilter: () => void;
  onRemoveFilter: (filterId: string) => void;
  onUpdateFilter: (filterId: string, patch: Partial<DashFilter>) => void;
  tabs: EditorTab[];
  onAddTab: () => void;
  onRenameTab: (tabId: string, title: string) => void;
  onMoveTab: (tabId: string, direction: 'up' | 'down') => void;
  onRemoveTab: (tabId: string) => void;
  rows: EditorRow[];
  /** Linha pré-selecionada quando a inserção veio do botão de uma linha. */
  targetRowId: string | null;
  isDirty: boolean;
  isAddingChart: boolean;
  onAddChart: (input: AddChartInput) => void;
}

export function InspectorDashboard({
  title,
  onTitleChange,
  filters,
  onAddFilter,
  onRemoveFilter,
  onUpdateFilter,
  tabs,
  onAddTab,
  onRenameTab,
  onMoveTab,
  onRemoveTab,
  rows,
  targetRowId,
  isDirty,
  isAddingChart,
  onAddChart,
}: InspectorDashboardProps) {
  return (
    <VStack gap={4}>
      <TextInput
        label="Título do dashboard"
        value={title}
        placeholder="Ex.: Dívida Ativa 2026"
        width="100%"
        onChange={onTitleChange}
      />

      <Divider />

      <FiltersEditor
        filters={filters}
        onAdd={onAddFilter}
        onRemove={onRemoveFilter}
        onUpdate={onUpdateFilter}
      />

      <Divider />

      {/* Abas antes da inserção: definir as abas é decidir a estrutura da
          página, e é essa decisão que dá sentido ao seletor de aba do canvas. */}
      <TabsEditor
        tabs={tabs}
        onAdd={onAddTab}
        onRename={onRenameTab}
        onMove={onMoveTab}
        onRemove={onRemoveTab}
      />

      <Divider />

      <AddChartForm
        rows={rows}
        lockedRowId={targetRowId}
        isDisabled={isDirty}
        isPending={isAddingChart}
        onAdd={onAddChart}
      />

      {/* Divisor antes da nota: sem ele a frase encostava no formulário acima
          e lia-se como instrução DE "Adicionar gráfico" — que é justamente a
          única coisa que ela não explica. */}
      <Divider />

      <Text type="supporting">
        Para editar um bloco, clique nele no canvas. Para editar uma linha, clique no nome
        dela.
      </Text>
    </VStack>
  );
}
