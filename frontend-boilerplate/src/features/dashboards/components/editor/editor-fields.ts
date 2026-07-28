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
import { BLOCK_ROW_HEIGHT, getBlock, rowHeightForTypes } from '@/shared/render-engine';
import type { DashFilterType } from '../../lib/dashboard-filters';
import type { BlockHeight, EditorBlock } from '../../lib/layout-editor';

/** Grade do contrato: um bloco ocupa de 1 a 12 colunas. */
export const SPAN_MIN = 1;
export const SPAN_MAX = 12;
/** Largura sugerida ao inserir um gráfico novo (meia linha). */
export const DEFAULT_SPAN = 6;

/* ----------------------------------------------------------- largura ------ */

/**
 * LARGURA, do jeito que o motor realmente a lê.
 *
 * O contrato guarda `span` de 1 a 12, mas o `BlockGrid` roda em modo `equal`
 * em todas as telas do produto: blocos que dividem a linha recebem faixas
 * IGUAIS, e a única leitura de `span` que sobrou é a inequívoca — `span >= 12`
 * significa "linha inteira".
 *
 * Ou seja: o campo "Largura (1–12)" do editor antigo era uma mentira de
 * interface. Escrever 7 e 5 em dois blocos não produzia 58%/42%; produzia dois
 * blocos iguais. Um controle que não faz o que promete é pior do que controle
 * nenhum, porque o usuário culpa a si mesmo. Aqui a escolha passa a ser a que
 * existe de verdade — e o `span` continua sendo o campo gravado, sem mudança
 * de contrato.
 */
export const FULL_WIDTH_SPAN = SPAN_MAX;
export const SHARED_WIDTH_SPAN = DEFAULT_SPAN;

export const WIDTH_OPTIONS: SelectorOptionData[] = [
  { value: 'shared', label: 'Divide a linha com os vizinhos' },
  { value: 'full', label: 'Linha inteira' },
];

/** `span` gravado → opção exibida. */
export function widthOptionOf(span: number): string {
  return span >= SPAN_MAX ? 'full' : 'shared';
}

/** Opção escolhida → `span` a gravar. */
export function spanForWidthOption(option: string): number {
  return option === 'full' ? FULL_WIDTH_SPAN : SHARED_WIDTH_SPAN;
}

/* ------------------------------------------------------------ altura ------ */

const HEIGHT_STEP_LABEL: Record<string, string> = {
  auto: 'ajustada ao conteúdo',
  compact: `compacta (${BLOCK_ROW_HEIGHT.compact} px)`,
  default: `padrão (${BLOCK_ROW_HEIGHT.default} px)`,
  tall: `alta (${BLOCK_ROW_HEIGHT.tall} px)`,
};

/**
 * Frase curta que descreve a altura EM VIGOR de uma linha — inclusive quando
 * ninguém a declarou.
 *
 * Mostrar o degrau derivado ("automática · alta") no caso ausente é o que
 * ensina o modelo mental: a pessoa vê que existe uma regra por trás, entende
 * qual foi a escolha do motor e só então decide se quer sobrescrevê-la. Um
 * simples "automática" esconderia a informação que a levaria a mexer no campo
 * certo.
 */
export function heightSummary(
  height: BlockHeight | undefined,
  blocks: Pick<EditorBlock, 'type'>[],
): string {
  if (typeof height === 'number') return `altura ${height} px`;
  if (typeof height === 'string') {
    return `altura ${HEIGHT_STEP_LABEL[height] ?? height}`;
  }
  const derived = rowHeightForTypes(blocks.map((block) => block.type));
  return `altura automática · ${HEIGHT_STEP_LABEL[derived] ?? derived}`;
}

/**
 * Nome humano de um bloco: o título do card, se houver; senão o id. É o que
 * entra no nome acessível dos botões — "Remover o bloco Mensagens por dia" diz
 * muito mais do que "Remover o bloco blk_7f3a".
 */
export function blockLabelOf(block: EditorBlock): string {
  const fromProps = block.props?.title;
  if (block.title && block.title.trim()) return block.title;
  if (typeof fromProps === 'string' && fromProps.trim()) return fromProps;
  return block.id;
}

/**
 * Nome de EXIBIÇÃO do bloco — o que vai no cabeçalho do inspetor.
 *
 * Difere de `blockLabelOf` no fallback, e a diferença é proposital: num nome
 * acessível de botão o id é a informação útil ("Remover o bloco blk_7f3a" casa
 * com o que se vê no payload); como TÍTULO de um painel, um id é ruído — ali o
 * nome do tipo ("Gráfico de barras") diz à pessoa o que ela selecionou.
 */
export function blockDisplayName(block: EditorBlock): string {
  const label = blockLabelOf(block);
  if (label !== block.id) return label;
  return getBlock(block.type)?.manifest.name ?? block.type;
}

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
