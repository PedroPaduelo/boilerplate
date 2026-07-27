/**
 * COMPONENTE PRÓPRIO — conteúdo do tooltip dos gráficos. O `Tooltip` do Astryx
 * é acionado por hover/foco em um elemento; o tooltip de gráfico é posicionado
 * pelo recharts e recebe o payload do ponto sob o cursor. Aqui montamos só o
 * CONTEÚDO — com `Card`/`Text` do DS — e o recharts cuida da posição.
 *
 * Um único componente para todos os gráficos: mesma hierarquia (título, linhas
 * cor + rótulo + valor tabular) em área, barras, linha, donut e dispersão.
 */
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { ChartSwatch } from './chart-swatch';

/** Uma linha do tooltip: cor da série, rótulo e valor já formatado. */
export interface ChartTooltipRow {
  /** Nome da série ou do eixo. */
  label: string;
  /** Valor já formatado pelo `valueFormatter` do gráfico. */
  value: string;
  /** Cor da série (do `useChartPalette`). Omita em linhas de eixo. */
  color?: string;
}

export interface ChartTooltipProps {
  /** Categoria/ponto sob o cursor. */
  title?: string;
  /** Linhas exibidas, na ordem das séries. */
  rows: ChartTooltipRow[];
}

/** Cartão de detalhe do ponto sob o cursor. */
export function ChartTooltip({ title, rows }: ChartTooltipProps) {
  if (rows.length === 0) return null;

  return (
    <Card padding={2} data-slot="chart-tooltip">
      <VStack gap={1}>
        {title ? <Text type="label">{title}</Text> : null}
        {rows.map((row, index) => (
          <HStack key={`${row.label}-${index}`} gap={3} hAlign="between" vAlign="center">
            <HStack gap={1.5} vAlign="center">
              {row.color ? <ChartSwatch color={row.color} /> : null}
              <Text type="supporting" color="secondary">
                {row.label}
              </Text>
            </HStack>
            <Text type="supporting" weight="medium" hasTabularNumbers>
              {row.value}
            </Text>
          </HStack>
        ))}
      </VStack>
    </Card>
  );
}
