/**
 * COMPONENTE PRÓPRIO DO BLOCO — o CARD DE RESUMO COM MINI-GRÁFICO da
 * referência (`04-widgets-prontos.md` §2), o widget que mais aparece em
 * dashboard. Nem o Astryx nem `@/shared/ui` têm esta COMPOSIÇÃO: o `KpiCard`
 * responde "quanto é"; o sinal responde "para onde está indo" — rótulo e valor
 * à esquerda, variação flutuando no topo-direito e a tendência desenhada no
 * canto inferior direito, tudo dentro do mesmo cartão.
 *
 * ---------------------------------------------------------------------------
 * ANATOMIA (`04-widgets-prontos.md` §2.1/§2.2) — medidas em pixels reais
 * ---------------------------------------------------------------------------
 *   Card ............... padding 24px (`padding={6}`), `position: relative`,
 *                        `box-shadow: none` (sobrescreve a sombra do Card)
 *   Bloco de tendência . absoluto, 16px do topo e da direita, `gap` 4px
 *   Ícone da tendência . 20px (`size="md"` = 1,25rem), ↗ subindo / ↘ caindo
 *   Texto da tendência . 12,25px/600, com `+` explícito quando positivo
 *   Título ............. 12,25px/600, 8px acima do valor
 *   Valor .............. 17,5px/700, algarismos tabulares
 *   Mini-gráfico ....... 100 × 66px (área), alinhado à direita e à base
 *
 * A cor da variação é LEITURA DE NEGÓCIO, não o sinal do número: subir 4% é
 * bom para arrecadação e ruim para latência — quem decide é `higherIsBetter`.
 *
 * Por ora só o bloco `signal_card` usa; se um segundo bloco precisar, a regra
 * da trilha manda promovê-lo para `@/shared/ui`.
 */
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { ChartText, SparkChart, chartPlainText, useChartPalette } from '@/shared/ui';
import type { ChartScope, ChartSeriesColor } from '@/shared/ui';
import { formatNumberBR } from '@/shared/lib/format';

export interface SignalCardProps {
  /** Rótulo curto do sinal (ex.: "Latência p95"). Aceita Markdown e `{{var}}`. */
  label: string;
  /** Valor em destaque, JÁ formatado. */
  value: string;
  /** Série da tendência, na ordem temporal. */
  data: number[];
  /** Variação como FRAÇÃO (0.042 = +4,2%). Sem ela, não há bloco de tendência. */
  trend?: number;
  /** Se subir é bom. Quando `false`, uma alta é sinalizada como piora. */
  higherIsBetter?: boolean;
  /** Mostra a tendência desenhada. */
  showSparkline?: boolean;
  /** Cor da série; sem ela, o tom `dark` da cor principal (§2.3). */
  color?: ChartSeriesColor;
  /** Escopo de interpolação dos textos (de `buildChartScope`). */
  scope?: ChartScope;
  /** Mensagem do estado sem dados. Aceita Markdown e `{{variaveis}}`. */
  emptyMessage?: string;
  /** Troca a tendência por esqueleto enquanto os dados não chegam. */
  isLoading?: boolean;
}

/**
 * Largura do mini-gráfico: 100px na variante ÁREA da referência (§2.4). A
 * altura vem do próprio `SparkChart`, que já conhece as três dimensões.
 */
const SPARK_WIDTH = 100;

/** Largura mínima da coluna de texto: 112px na referência (§2.2). */
const TEXT_MIN_WIDTH = 112;

/**
 * Distância do bloco de tendência às bordas do card: 16px do topo e da direita
 * (§2.2). Vem do token de espaçamento do DS, não de um px cravado.
 */
const TREND_INSET = 'var(--spacing-4)';

/**
 * Respiro reservado ao bloco de tendência, que FLUTUA no topo-direito (§2.2):
 * 16px do topo + 20px de ícone = 36px; com os 24px de padding do card sobram
 * 12px (`--spacing-3`). Reservado SEMPRE — assim uma fileira de sinais tem
 * cards da mesma altura, com ou sem variação. O `Stack` do DS só expõe padding
 * nos dois eixos inteiros, então este lado único vai por `style`.
 */
const TREND_RESERVE = 'var(--spacing-3)';

/**
 * Variação com sinal explícito e uma casa decimal, em pt-BR. A referência pede
 * o `+` quando positivo (§2.2) — o `-` já vem do próprio número.
 */
function formatTrend(fraction: number): string {
  const points = fraction * 100;
  return `${points >= 0 ? '+' : ''}${formatNumberBR(points, 1)}%`;
}

/** Card de resumo: rótulo, valor em destaque, variação e tendência desenhada. */
export function SignalCard({
  label,
  value,
  data,
  trend,
  higherIsBetter = true,
  showSparkline = true,
  color,
  scope,
  emptyMessage,
  isLoading = false,
}: SignalCardProps) {
  const palette = useChartPalette();
  const isUp = (trend ?? 0) >= 0;
  const isGood = isUp === higherIsBetter;

  return (
    <Card
      padding={6}
      data-slot="signal-card"
      // §2.1: o card de resumo é `position: relative` (âncora do bloco de
      // tendência) e SEM sombra — sobrescreve a sombra padrão do Card.
      style={{ position: 'relative', boxShadow: 'none' }}
    >
      {trend !== undefined ? (
        <HStack
          gap={1}
          vAlign="center"
          data-slot="signal-card-trend"
          data-variant={isGood ? 'success' : 'error'}
          style={{
            position: 'absolute',
            top: TREND_INSET,
            insetInlineEnd: TREND_INSET,
            // Leitura de negócio: a cor sai do chrome do tema, nunca de hex.
            color: palette.chromeVar(isGood ? 'positive' : 'negative'),
          }}
        >
          <Icon icon={isUp ? TrendingUp : TrendingDown} size="md" color="inherit" />
          <Text size="2xs" weight="semibold" color="inherit" hasTabularNumbers>
            <ChartText value={formatTrend(trend)} scope={scope} />
          </Text>
        </HStack>
      ) : null}

      <HStack
        gap={2}
        hAlign="between"
        vAlign="end"
        style={{ paddingBlockStart: TREND_RESERVE }}
      >
        {/* Coluna de texto: cresce e nunca abaixo de 112px (§2.2). */}
        <VStack gap={2} style={{ flexGrow: 1, minWidth: TEXT_MIN_WIDTH }}>
          <Text size="2xs" weight="semibold" maxLines={1}>
            <ChartText value={label} scope={scope} />
          </Text>
          <Text size="xl" weight="bold" hasTabularNumbers>
            {value}
          </Text>
        </VStack>

        {showSparkline ? (
          // O mini-gráfico tem tamanho fixo: quem cede espaço é o texto.
          <VStack width={SPARK_WIDTH} vAlign="end" style={{ flexShrink: 0 }}>
            <SparkChart
              data={data}
              type="area"
              color={color}
              label={`${chartPlainText(label, scope) || label}: tendência`}
              scope={scope}
              emptyMessage={emptyMessage}
              isLoading={isLoading}
            />
          </VStack>
        ) : null}
      </HStack>
    </Card>
  );
}
