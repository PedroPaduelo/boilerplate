/**
 * COMPONENTE PRÓPRIO — legenda de gráfico. O Astryx não tem legenda (nem
 * gráficos), e a do recharts renderiza markup próprio, fora dos tokens.
 * Centralizar aqui garante que área, barras, linha, donut e dispersão usem a
 * MESMA legenda — mesma tipografia (`Text`), mesmo espaçamento, mesma cor.
 *
 * Apresentação pura: não filtra séries. Filtro de série é estado de tela e
 * mora em quem usa o gráfico, não dentro dele.
 */
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { ChartSwatch } from './chart-swatch';

/** Uma entrada da legenda. */
export interface ChartLegendItem {
  /** Nome da série/categoria. */
  label: string;
  /** Cor já resolvida pelo `useChartPalette`. */
  color: string;
}

export interface ChartLegendProps {
  /** Entradas exibidas, na ordem das séries. */
  items: ChartLegendItem[];
  /** Alinhamento horizontal do bloco. */
  align?: 'start' | 'center' | 'end';
  /** Formato da marca de cor. */
  shape?: 'dot' | 'bar';
}

/** Lista de séries → cor, exibida abaixo da área de plotagem. */
export function ChartLegend({
  items,
  align = 'center',
  shape = 'dot',
}: ChartLegendProps) {
  if (items.length === 0) return null;

  return (
    <HStack
      as="ul"
      gap={3}
      wrap="wrap"
      hAlign={align}
      vAlign="center"
      data-slot="chart-legend"
    >
      {items.map((item, index) => (
        <HStack as="li" key={`${item.label}-${index}`} gap={1.5} vAlign="center">
          <ChartSwatch color={item.color} shape={shape} />
          <Text type="supporting" color="secondary">
            {item.label}
          </Text>
        </HStack>
      ))}
    </HStack>
  );
}
