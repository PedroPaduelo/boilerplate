/**
 * TOOLTIP dos gráficos — o elemento que mais denuncia uma reprodução malfeita.
 *
 * A referência (`05-tooltip-legenda-css.md` §1) pede um cartão translúcido com
 * desfoque, raio 10px, largura mínima 80px, sem borda, e um título centralizado
 * em negrito sobre uma faixa cinza. A maioria das bibliotecas entrega uma caixa
 * escura ou branca opaca — por isso o visual não vem do motor: vem das classes
 * de `chart-theme.css`, cujas cores saem todas de token do DS.
 *
 * Um único componente para todos os gráficos: mesma hierarquia (título, linhas
 * cor + rótulo + valor tabular) em área, barras, linha, rosca e dispersão.
 */
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
  /** Categoria/ponto sob o cursor. Vira a faixa do topo. */
  title?: string;
  /** Linhas exibidas, na ordem das séries. */
  rows: ChartTooltipRow[];
}

/** Cartão de detalhe do ponto sob o cursor. */
export function ChartTooltip({ title, rows }: ChartTooltipProps) {
  if (rows.length === 0) return null;

  return (
    <div className="chart-tooltip" data-slot="chart-tooltip">
      {title ? (
        <span className="chart-tooltip__title" data-slot="chart-tooltip-title">
          {title}
        </span>
      ) : null}
      <div className="chart-tooltip__group">
        <VStack gap={0.5}>
          {rows.map((row, index) => (
            <HStack
              key={`${row.label}-${index}`}
              gap={3}
              hAlign="between"
              vAlign="center"
            >
              <HStack gap={1} vAlign="center">
                {row.color ? <ChartSwatch color={row.color} /> : null}
                <Text type="supporting" color="secondary">
                  {row.label}
                </Text>
              </HStack>
              <Text type="supporting" weight="semibold" hasTabularNumbers>
                {row.value}
              </Text>
            </HStack>
          ))}
        </VStack>
      </div>
    </div>
  );
}
