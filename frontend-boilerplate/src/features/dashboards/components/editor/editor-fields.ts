/**
 * Opções e helpers COMPARTILHADOS pelos formulários do editor.
 *
 * Vive fora dos componentes por dois motivos: as listas são estáveis (não
 * precisam ser recriadas a cada render) e os mesmos rótulos aparecem em mais de
 * um formulário — duplicá-los é como as traduções saem de sincronia.
 *
 * Os VALORES são sempre os enums do CONTRATO de layout (doc 20); só os rótulos
 * são traduzidos.
 */
import type { SelectorOptionData } from '@astryxdesign/core/Selector';
import type { DashFilterType } from '../../lib/dashboard-filters';

/** Grade do contrato: um bloco ocupa de 1 a 12 colunas. */
export const SPAN_MIN = 1;
export const SPAN_MAX = 12;
/** Largura sugerida ao inserir um gráfico novo (meia linha). */
export const DEFAULT_SPAN = 6;

/**
 * `Record` (e não um array solto) para que o compilador cobre exaustividade:
 * um tipo novo no contrato quebra o build aqui em vez de sumir da interface.
 */
const FILTER_TYPE_LABELS: Record<DashFilterType, string> = {
  date_range: 'Intervalo de datas',
  select: 'Seleção única',
  multiselect: 'Seleção múltipla',
  search: 'Busca por texto',
  number_range: 'Intervalo numérico',
};

export const FILTER_TYPE_OPTIONS: SelectorOptionData[] = (
  Object.keys(FILTER_TYPE_LABELS) as DashFilterType[]
).map((type) => ({ value: type, label: FILTER_TYPE_LABELS[type] }));

/** Níveis aceitos pelo bloco narrativo `title`. */
export const TITLE_LEVEL_OPTIONS: SelectorOptionData[] = [
  { value: '1', label: 'H1' },
  { value: '2', label: 'H2' },
  { value: '3', label: 'H3' },
];

/**
 * `add_chart_to_dashboard` aplica sobre o draft do SERVIDOR; com edição local
 * pendente a inserção sobrescreveria o trabalho não salvo.
 */
export const UNSAVED_CHANGES_HINT = 'Salve o rascunho antes de adicionar um gráfico.';

/**
 * Erro inline para campo que o contrato exige preenchido. O `validateLayoutForSave`
 * continua sendo a autoridade no salvar — isto só antecipa o aviso para o campo,
 * em vez de deixar o usuário descobrir no banner depois de clicar em Salvar.
 */
export function requiredFieldStatus(
  value: string,
): { type: 'error'; message: string } | undefined {
  return value.trim() === ''
    ? { type: 'error', message: 'Obrigatório pelo contrato de layout.' }
    : undefined;
}
