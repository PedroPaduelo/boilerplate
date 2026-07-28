/**
 * Leitura do `ChatChartPayload` — o que o card precisa saber ANTES de desenhar.
 *
 * Fica separado do componente porque são as duas perguntas que tanto o card
 * quanto a LISTA fazem: "este payload dá para renderizar?" (senão vira Banner
 * de erro, que ocupa largura cheia e não pode ir para a grade de cartões) e
 * "que bloco o render-engine recebe?". Repetir isso nos dois lugares deixaria
 * as respostas divergirem com o tempo.
 */
import type { Block } from '@dashboards/contracts';
import { hasBlock } from '@/shared/render-engine';
import type { ChatChartPayload } from '../transport';

/**
 * O ENVELOPE do gráfico veio utilizável? Devolve o motivo técnico quando não.
 *
 * Só cuida do que impede o render de acontecer. O erro DO DADO (query que
 * falhou, consulta sem linhas) continua sendo do `BlockRenderer`, que já o
 * mostra no lugar certo — duplicar aqui daria duas mensagens para um problema.
 */
export function payloadProblem(chart: ChatChartPayload): string | undefined {
  const catalogType = chart.catalogType?.trim();
  if (!catalogType) return 'O agente não informou o tipo de bloco (catalogType).';
  if (!hasBlock(catalogType)) {
    return `Tipo de bloco desconhecido nesta versão: "${catalogType}".`;
  }

  const result: unknown = chart.result;
  const isRenderable =
    !!result &&
    typeof result === 'object' &&
    typeof (result as { state?: unknown }).state === 'string';
  if (!isRenderable) return 'O agente não enviou os dados do gráfico (result).';

  return undefined;
}

/**
 * Bloco sintético para o render-engine (mesmo contrato do dashboard).
 *
 * `title` vai junto porque os cartões de número usam o título do bloco como
 * rótulo quando o agente não mandou `label` — sem isso, um KPI sem `label` cai
 * no fallback genérico do componente e aparece escrito "KPI".
 */
export function toBlock(chart: ChatChartPayload): Block {
  return {
    id: chart.result.blockId ?? 'chat_inline',
    type: chart.catalogType,
    span: 12,
    title: chart.title,
    props: chart.props,
  } as Block;
}
