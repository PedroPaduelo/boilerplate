/**
 * Legenda do bloco `donut` — extraída porque é uma LISTA de leitura, não parte
 * do desenho: cada linha traz categoria, valor absoluto e participação no
 * total, que é justamente o que o anel não consegue dizer.
 *
 * Por que não a `ChartLegend` da base: ela resolve "qual cor é qual série" (só
 * marca + rótulo). Aqui a legenda é a TABELA do gráfico — sem ela, o anel vira
 * decoração e o usuário precisa passar o mouse fatia por fatia para ler número.
 *
 * A cor de cada marca vem da MESMA paleta que pinta a fatia (`useChartPalette`),
 * então legenda e anel nunca discordam.
 */
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { ChartSwatch, useChartPalette } from '@/shared/ui';
import type { ChartPoint } from '@/shared/ui';
import { formatPercentBR } from '@/shared/lib/format';

export interface DonutLegendProps {
  /** Fatias, na mesma ordem em que foram desenhadas. */
  data: ChartPoint[];
  /** Total das fatias — denominador da participação. */
  total: number;
  /** Formata o valor absoluto de cada fatia. */
  valueFormatter: (value: number) => string;
}

/** Lista categoria → cor, valor e participação, ao lado do anel. */
export function DonutLegend({ data, total, valueFormatter }: DonutLegendProps) {
  const palette = useChartPalette();
  if (data.length === 0) return null;

  // Evita divisão por zero sem esconder o dado: com total 0, toda fatia é 0%.
  const denominator = total || 1;

  return (
    <VStack as="ul" gap={1} maxWidth={320} data-slot="donut-legend">
      {data.map((point, index) => (
        <HStack
          as="li"
          key={`${point.label}-${index}`}
          gap={2}
          vAlign="center"
          hAlign="between"
        >
          <HStack gap={1.5} vAlign="center">
            <ChartSwatch color={palette.varAt(index, point.color)} />
            <Text type="supporting" maxLines={1}>
              {point.label}
            </Text>
          </HStack>
          <HStack gap={2} vAlign="center">
            <Text type="supporting" weight="medium" hasTabularNumbers>
              {valueFormatter(point.value)}
            </Text>
            <Text type="supporting" color="secondary" hasTabularNumbers>
              {formatPercentBR(point.value / denominator)}
            </Text>
          </HStack>
        </HStack>
      ))}
    </VStack>
  );
}
