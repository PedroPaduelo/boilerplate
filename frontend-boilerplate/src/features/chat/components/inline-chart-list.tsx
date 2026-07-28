/**
 * Todos os gráficos de uma resposta, na ordem em que o agente os montou.
 *
 * Existe separado do card porque a decisão aqui é sobre a SEQUÊNCIA, não sobre
 * um gráfico: os cartões de número vizinhos entram numa grade em vez de virarem
 * uma pilha. Um pedido de painel devolve quatro KPIs seguidos e, empilhados,
 * cada um vira uma faixa larga e quase vazia (medimos 1110 × 157 px para exibir
 * "4.080") — a resposta ganha metros de rolagem antes do primeiro gráfico de
 * verdade. Lado a lado eles também ficam comparáveis, que é o motivo de terem
 * sido pedidos juntos.
 */
import { Grid } from '@astryxdesign/core/Grid';
import { VStack } from '@astryxdesign/core/Stack';
import {
  COMPACT_CARD_MAX_COLUMNS,
  COMPACT_CARD_MIN_WIDTH,
  isCompactCardBlock,
} from '@/shared/render-engine';
import type { ChatChartPayload } from '../transport';
// Importa o CARD direto (não pelo barril `inline-chart.tsx`) para não criar
// ciclo: o barril é quem reexporta esta lista.
import { InlineChart } from './inline-chart-card';
import { payloadProblem } from './inline-chart-payload';

export interface InlineChartsProps {
  charts: readonly ChatChartPayload[];
  /** Id da mensagem — compõe a chave estável de cada card. */
  messageId: string;
  /** Repassa a animação de entrada (só no turno em andamento). */
  isEntering?: boolean;
}

export function InlineCharts({
  charts,
  messageId,
  isEntering = false,
}: InlineChartsProps) {
  if (charts.length === 0) return null;

  return (
    <>
      {groupCharts(charts).map((group) => {
        const key = `${messageId}:g${group.startIndex}`;
        const cards = group.items.map((item) => (
          <InlineChart
            key={chartKey(item.chart, messageId, item.index)}
            chart={item.chart}
            isEntering={isEntering}
          />
        ));

        if (!group.isCompact) {
          return (
            <VStack key={key} gap={3}>
              {cards}
            </VStack>
          );
        }

        return (
          <Grid
            key={key}
            columns={{ minWidth: COMPACT_CARD_MIN_WIDTH, max: COMPACT_CARD_MAX_COLUMNS }}
            gap={2}
            data-slot="inline-chart-grid"
          >
            {cards}
          </Grid>
        );
      })}
    </>
  );
}

interface ChartGroup {
  isCompact: boolean;
  startIndex: number;
  items: { chart: ChatChartPayload; index: number }[];
}

/** Fatia a lista em blocos consecutivos de "cartão compacto" e "gráfico". */
function groupCharts(charts: readonly ChatChartPayload[]): ChartGroup[] {
  const groups: ChartGroup[] = [];

  charts.forEach((chart, index) => {
    // Um payload quebrado vira Banner de erro (largura cheia): agrupá-lo como
    // cartão compacto espremeria a mensagem numa coluna de 220 px.
    const isCompact =
      !payloadProblem(chart) && isCompactCardBlock(chart.catalogType ?? '');
    const current = groups[groups.length - 1];

    if (current && current.isCompact === isCompact) {
      current.items.push({ chart, index });
      return;
    }
    groups.push({ isCompact, startIndex: index, items: [{ chart, index }] });
  });

  return groups;
}

/** Chave estável por gráfico — a mesma regra que a lista de mensagens usava. */
function chartKey(chart: ChatChartPayload, messageId: string, index: number): string {
  return chart.chartId ?? chart.result?.blockId ?? `${messageId}:${index}`;
}
