/**
 * Estado do formulário "adicionar gráfico" do editor (`POST /dashboards/:id/blocks`).
 *
 * Concentra o que NÃO é apresentação: a busca do catálogo de gráficos, a
 * derivação das opções dos dois seletores e a montagem do `AddChartInput`. O
 * componente fica só com o JSX — assim a regra (ex.: "linha nova ao final" é
 * ausência de `rowId`, não um id sentinela indo para a API) é testável sem DOM.
 */
import { useMemo, useState } from 'react';
import type { SelectorOptionData } from '@astryxdesign/core/Selector';
import { useCharts } from '@/features/charts/hooks';
import { DEFAULT_SPAN } from './components/editor/editor-fields';
import type { EditorRow } from './lib/layout-editor';
import type { AddChartInput } from './types';

/**
 * Valor sentinela do seletor de linha. NUNCA vai para a API: quando ele está
 * selecionado, o `rowId` é omitido e o backend cria uma linha ao final.
 */
const NEW_ROW_VALUE = '__new_row';

export interface UseAddChartFormOptions {
  /** Linhas do layout em edição (destinos possíveis do bloco). */
  rows: EditorRow[];
  /**
   * Linha de destino imposta de fora — é o que faz "Adicionar gráfico" no
   * cabeçalho de uma linha significar NAQUELA linha. Quando presente, o
   * seletor de destino some: escolher de novo o que já foi escolhido é
   * burocracia, e um seletor que discorda do gesto anterior é armadilha.
   */
  lockedRowId?: string | null;
  onAdd: (input: AddChartInput) => void;
}

export interface AddChartFormState {
  chartId: string;
  setChartId: (chartId: string) => void;
  rowId: string;
  setRowId: (rowId: string) => void;
  span: number;
  setSpan: (span: number) => void;
  chartOptions: SelectorOptionData[];
  rowOptions: SelectorOptionData[];
  isLoadingCharts: boolean;
  hasCharts: boolean;
  /** Só há o que enviar depois que um gráfico foi escolhido. */
  canSubmit: boolean;
  submit: () => void;
}

export function useAddChartForm({
  rows,
  lockedRowId,
  onAdd,
}: UseAddChartFormOptions): AddChartFormState {
  const { data, isLoading } = useCharts();
  const charts = useMemo(() => data?.charts ?? [], [data]);

  const [chartId, setChartId] = useState('');
  const [ownRowId, setRowId] = useState(NEW_ROW_VALUE);
  const [span, setSpan] = useState(DEFAULT_SPAN);

  // A linha imposta vence a escolhida no seletor — mas só enquanto ela existir:
  // remover a linha entre o clique e o envio não pode mandar um `rowId` morto
  // para a API (o backend criaria um bloco órfão).
  const rowId =
    lockedRowId && rows.some((row) => row.id === lockedRowId) ? lockedRowId : ownRowId;

  const chartOptions = useMemo<SelectorOptionData[]>(
    () => charts.map((chart) => ({ value: chart.id, label: chart.title })),
    [charts],
  );

  const rowOptions = useMemo<SelectorOptionData[]>(
    () => [
      { value: NEW_ROW_VALUE, label: 'Nova linha (ao final)' },
      ...rows.map((row, index) => ({
        value: row.id,
        label: row.title || `Linha ${index + 1}`,
      })),
    ],
    [rows],
  );

  // Limpa só o gráfico: linha e largura costumam repetir na inserção seguinte.
  const submit = () => {
    if (!chartId) return;
    onAdd({ chartId, span, ...(rowId !== NEW_ROW_VALUE ? { rowId } : {}) });
    setChartId('');
  };

  return {
    chartId,
    setChartId,
    rowId,
    setRowId,
    span,
    setSpan,
    chartOptions,
    rowOptions,
    isLoadingCharts: isLoading,
    hasCharts: charts.length > 0,
    canSubmit: chartId !== '',
    submit,
  };
}
