/**
 * CABEÇALHO DA ETAPA — o que fica visível mesmo com o painel fechado, e que é
 * também o GATILHO do colapso: marca de cor, rótulo, valor, taxa de conversão,
 * a barra e a legenda da barra.
 *
 * Extraído do componente do bloco por tamanho e por natureza: aqui é
 * apresentação pura (recebe o resumo já lido por `funnel-data`), enquanto o
 * `component.tsx` cuida de estado, dados e composição.
 *
 * ---------------------------------------------------------------------------
 * TIPOGRAFIA — a LEGENDA PRÓPRIA da referência (`05-tooltip-legenda-css.md` §3)
 * ---------------------------------------------------------------------------
 * Funil não existe na referência, mas o par "rótulo em cima, número embaixo" é
 * exatamente a legenda própria dos circulares — e é dela que vêm as medidas:
 *
 *   rótulo ............... 11,375px / 500  (`typography.ownLegend`)
 *   marca → rótulo ....... 6px de intervalo (`gap={1.5}`, §3)
 *   valor ................ 14,875px / 600  (`typography.ownLegendValue`)
 *   rótulo → valor ....... 8px             (`gap={2}`, o `margin-top` da §3)
 *   taxa de conversão .... 12,25px / 600 na cor secundária de leitura — o
 *                          degrau do rótulo "Total" central (`01-fundamentos.md`
 *                          §4), que cumpre o mesmo papel: um número de apoio ao
 *                          lado do número principal.
 *
 * Nenhum desses números é escrito aqui: todos saem de `useChartPalette()`.
 *
 * Tudo em `as="span"`: isto vive dentro de um <button> (o gatilho do
 * `Collapsible`), e conteúdo de botão precisa ser inline — não <div>.
 */
import type { CSSProperties } from 'react';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import {
  ChartSwatch,
  ChartText,
  chartPlainText,
  chartRampToken,
  chartTokenVar,
  useChartPalette,
} from '@/shared/ui';
import type { ChartRampColor, ChartScope } from '@/shared/ui';
import { formatNumberBR, formatPercentBR } from '@/shared/lib/format';
import { FunnelBar } from './funnel-bar';
import type { FunnelSummary } from './funnel-data';

export interface FunnelHeaderProps {
  /** Rótulo da etapa (aceita Markdown + `{{variavel}}`). */
  stageLabel: string;
  /** Legenda exibida sob a barra (mesmo contrato de texto). */
  barLabel?: string;
  /** Resumo da etapa: quantidade, participação no universo e valor. */
  summary?: FunnelSummary;
  /** Peso de cada desfecho na barra (mesma ordem da tabela). */
  weights: number[];
  /** Rampa do design system que pinta a barra e a marca de cor. */
  color: ChartRampColor;
  /** Escopo de interpolação dos textos (de `buildChartScope`). */
  scope: ChartScope;
  /** Formata os valores monetários (definido pela prop `valueFormat`). */
  money: (value: unknown) => string;
}

/** Tom da rampa usado na marca de cor: o principal (o meio da escala). */
const SWATCH_STEP = 3;

/** Casas decimais da taxa de conversão — o funil compara frações próximas. */
const RATE_DIGITS = 2;

/** Participação da etapa no universo, já formatada. */
function conversionOf(summary?: FunnelSummary): string | undefined {
  if (!summary?.hasFraction) return undefined;
  return `${formatPercentBR(summary.fraction, RATE_DIGITS)} dos lançamentos`;
}

/** Cabeçalho da etapa: marca, rótulo, valor, taxa de conversão e barra. */
export function FunnelHeader({
  stageLabel,
  barLabel,
  summary,
  weights,
  color,
  scope,
  money,
}: FunnelHeaderProps) {
  const palette = useChartPalette();

  /** Rótulo: o degrau da legenda própria, na cor de rótulo do chrome. */
  const labelStyle: CSSProperties = {
    fontSize: palette.typography.ownLegend.size,
    fontWeight: palette.typography.ownLegend.weight,
    color: palette.chromeVar('label'),
  };

  /** Valor: o degrau de valor da legenda própria, na cor de ênfase. */
  const valueStyle: CSSProperties = {
    fontSize: palette.typography.ownLegendValue.size,
    fontWeight: palette.typography.ownLegendValue.weight,
    color: palette.chromeVar('emphasis'),
    fontVariantNumeric: 'tabular-nums',
  };

  /** Taxa de conversão: o degrau do "Total" central, na cor secundária. */
  const rateStyle: CSSProperties = {
    fontSize: palette.typography.centerTotal.size,
    fontWeight: palette.typography.centerTotal.weight,
    color: palette.chromeVar('label'),
    fontVariantNumeric: 'tabular-nums',
  };

  const conversion = conversionOf(summary);
  const plainLabel = chartPlainText(stageLabel, scope) || stageLabel;

  return (
    <VStack as="span" gap={2} width="100%">
      <HStack as="span" gap={3} hAlign="between" vAlign="end" wrap="wrap">
        {/* Par rótulo/valor — o item da legenda própria (§3). */}
        <VStack as="span" gap={2}>
          <HStack as="span" gap={1.5} vAlign="center">
            <ChartSwatch
              color={chartTokenVar(chartRampToken(color, SWATCH_STEP))}
              shape="bar"
            />
            <span style={labelStyle}>
              <ChartText value={stageLabel} scope={scope} />
            </span>
          </HStack>
          <span style={valueStyle}>{money(summary?.value)}</span>
        </VStack>

        {/* Taxa de conversão e volume da etapa. */}
        <VStack as="span" gap={0.5} hAlign="end">
          {conversion ? <span style={rateStyle}>{conversion}</span> : null}
          <Text as="span" type="supporting" color="secondary" hasTabularNumbers>
            {summary?.quantity != null ? formatNumberBR(summary.quantity, 0) : '—'}
          </Text>
        </VStack>
      </HStack>

      <FunnelBar
        fraction={summary?.fraction ?? 0}
        weights={weights}
        color={color}
        label={`${plainLabel}: ${conversion ?? 'participação no universo'}`}
      />

      {barLabel ? (
        <Text as="span" type="supporting" color="secondary">
          <ChartText value={barLabel} scope={scope} />
        </Text>
      ) : null}
    </VStack>
  );
}
