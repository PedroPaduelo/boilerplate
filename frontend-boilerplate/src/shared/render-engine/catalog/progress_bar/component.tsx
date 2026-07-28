/**
 * Bloco `progress_bar` (shape 'scalar') — progresso de um valor sobre uma
 * escala, desenhado como a BARRA HORIZONTAL da referência (§8) na versão
 * ESCALAR: uma barra só, com rótulo à esquerda e leitura à direita.
 *
 * POR QUE SAIU DO `ProgressBar` DO ASTRYX: a barra do DS é uma cápsula, pinta
 * por variante semântica e traz tipografia própria. A referência pede raio de
 * 2 px, trilha a 16 % e a tipografia da legenda própria (11,375 / 14,875) —
 * nada disso é configurável ali. Sobrou o par que o resto do catálogo já usa:
 * `ChartBarTrack` (a marca de dado da base, §8) dentro do `ChartFrame`
 * (cabeçalho, estados e acessibilidade).
 *
 * As props seguem IDÊNTICAS (`max`, `variant`, `accent`, `showValue`):
 * `variant` continua escolhendo a cor semântica e `accent`, quando preenchido,
 * continua vencendo o `variant` — só que agora a cor sai do tema de gráfico
 * (`useChartPalette`), e não das variantes do DS. A barra continua se
 * anunciando como `progressbar` com valor, mínimo e máximo.
 *
 * ---------------------------------------------------------------------------
 * CONFORMIDADE VISUAL (checklist §4 do briefing)
 * ---------------------------------------------------------------------------
 * 1. Grade só horizontal, tracejada 3 ..... n/a — barra escalar não tem grade
 * 2. Eixos sem linha e sem marcações ...... n/a — não há eixo
 * 3. Texto dos eixos 12 px/400 ............ n/a — o texto aqui é rótulo e valor,
 *    na tipografia da legenda PRÓPRIA: 11,375/500 e 14,875/600
 * 4. Linha 2,5 px, curva suave, sem pontos  n/a — não há linha
 * 5. Raio da barra ........................ §8: 2 px (`geometry.barRadiusFlat`)
 *    e traço 0 — não o raio 4 px da coluna, e cápsula nunca
 * 6. Hover escurece ....................... n/a — a barra não é interativa
 * 7. Tooltip branco 90 % com desfoque ..... n/a — a leitura já está escrita ao
 *    lado do rótulo, não há o que revelar no ponteiro
 * + Trilha `rgba(145,158,171,0.16)` ....... `palette.chrome('track')` (§02-10)
 * + Cor do preenchimento .................. `palette.primary80` — o verde a 80 %,
 *    a cor mais recorrente do catálogo — ou a cor do acento
 * + Animação de entrada 360 ms ............ `palette.motion.duration` na largura
 * + Cabeçalho, estados e markdown ......... `ChartFrame` + `ChartText`
 */
import type { CSSProperties } from 'react';
import type { ScalarData } from '@dashboards/contracts';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { formatNumberBR, formatPercentBR, toNumber } from '@/shared/lib/format';
import {
  CHART_HEIGHT,
  ChartBarTrack,
  ChartFrame,
  ChartText,
  buildChartScope,
  chartAccentColor,
  useChartPalette,
} from '@/shared/ui';
import type { ChartChromeRole, ChartPalette } from '@/shared/ui';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

/** Variantes semânticas de cor aceitas pelo bloco (vocabulário do DS). */
type ProgressVariant = 'accent' | 'success' | 'warning' | 'error' | 'neutral';

type ProgressBarProps = {
  /** Valor máximo (escala) usado para calcular o %. Default: 100. */
  max?: number;
  /** Cor semântica do preenchimento. Sobrescrita por `accent`. */
  variant?: 'default' | 'neutral' | 'warning' | 'error' | 'success';
  /** Cor de destaque (ver manifest): preenchida, pinta a barra com o acento. */
  accent?: string;
  /** Mostra a leitura do valor ao lado do rótulo. */
  showValue?: boolean;
};

/** Escala default do progresso quando `max` não vem nas props. */
const DEFAULT_MAX = 100;

/** Vocabulário antigo → variante semântica. */
const VARIANT: Record<string, ProgressVariant> = {
  default: 'accent',
  neutral: 'neutral',
  warning: 'warning',
  error: 'error',
  success: 'success',
};

/**
 * Variante semântica → papel de chrome do tema de gráfico. `accent` fica de
 * fora porque não é um papel fixo: é o verde a 80 % da referência ou a cor do
 * acento escolhido pelo bloco.
 */
const VARIANT_CHROME: Record<Exclude<ProgressVariant, 'accent'>, ChartChromeRole> = {
  success: 'positive',
  warning: 'warning',
  error: 'negative',
  neutral: 'neutral',
};

/** Cor do preenchimento: acento > verde a 80 % (default) > papel semântico. */
function fillColor(
  palette: ChartPalette,
  variant: ProgressVariant,
  accent: string | undefined,
): string {
  if (variant !== 'accent') return palette.chromeVar(VARIANT_CHROME[variant]);
  const color = chartAccentColor(accent);
  // Sem acento reconhecível, a barra usa `rgba(0,120,103,0.8)` — a cor mais
  // recorrente do catálogo da referência (`01-fundamentos.md` §2.1).
  return color ? palette.varAt(0, color) : palette.primary80;
}

/**
 * Rótulo e leitura na tipografia da LEGENDA PRÓPRIA da referência
 * (`01-fundamentos.md` §4): 11,375/500 e 14,875/600. Os dois degraus não
 * existem na escala do tema — são medidas do desenho, declaradas uma única vez
 * em `CHART_TYPOGRAPHY` e consumidas daqui (mesma decisão da base em NOTAS).
 */
function readoutStyle(palette: ChartPalette): {
  label: CSSProperties;
  value: CSSProperties;
} {
  return {
    label: {
      fontSize: palette.typography.ownLegend.size,
      fontWeight: palette.typography.ownLegend.weight,
      color: palette.chromeVar('label'),
    },
    value: {
      fontSize: palette.typography.ownLegendValue.size,
      fontWeight: palette.typography.ownLegendValue.weight,
      color: palette.chromeVar('emphasis'),
      fontVariantNumeric: 'tabular-nums',
    },
  };
}

/** Leitura do valor: percentual na escala de 100, "valor de total" nas demais. */
function readValue(value: number, max: number): string {
  return max === DEFAULT_MAX
    ? formatPercentBR(value / max)
    : `${formatNumberBR(value)} de ${formatNumberBR(max)}`;
}

export const Component: BlockComponent<ProgressBarProps, ScalarData> = ({
  props,
  data,
  state,
  error,
}) => {
  const palette = useChartPalette();

  const value = toNumber(data?.value);
  const rawMax = props.max ?? DEFAULT_MAX;
  const max = rawMax > 0 ? rawMax : DEFAULT_MAX;
  const reading = value == null ? '' : readValue(value, max);

  // Contrato comum: rótulo, leitura e mensagem de vazio aceitam Markdown e
  // `{{variavel}}`. O escopo vem dos dados; `escala` e `leitura` são o que só
  // este bloco sabe (a escala é prop, não dado).
  const scope = buildChartScope(data, { escala: max, leitura: reading });
  const label = data?.label ?? manifest.name;

  // `accent` preenchido vence o `variant`, como no comportamento antigo.
  const hasAccent = typeof props.accent === 'string' && props.accent.trim() !== '';
  const variant: ProgressVariant = hasAccent
    ? 'accent'
    : (VARIANT[props.variant ?? 'default'] ?? 'accent');

  const frameState =
    state === 'loading' || state === 'skeleton'
      ? 'loading'
      : state === 'error'
        ? 'error'
        : value == null
          ? 'empty'
          : 'success';

  const text = readoutStyle(palette);

  return (
    <ChartFrame
      label={label}
      scope={scope}
      // Mini-gráfico: a caixa do desenho é a altura compacta do tema; o corpo
      // do `BlockFrame` (família `compact`) centraliza o conjunto.
      height={CHART_HEIGHT.spark}
      role="progressbar"
      valueNow={value ?? undefined}
      valueMin={0}
      valueMax={max}
      valueText={reading || undefined}
      state={frameState}
      errorMessage={error}
      isBare
      isCompact
    >
      <VStack
        gap={2}
        width="100%"
        height="100%"
        justify="center"
        data-slot="progress-bar"
        data-variant={variant}
      >
        <HStack gap={2} hAlign="between" vAlign="end">
          <span style={text.label}>
            <ChartText value={label} scope={scope} />
          </span>
          {(props.showValue ?? true) ? <span style={text.value}>{reading}</span> : null}
        </HStack>

        <ChartBarTrack
          ratio={value == null ? 0 : value / max}
          color={fillColor(palette, variant, props.accent)}
          size="md"
        />
      </VStack>
    </ChartFrame>
  );
};

/**
 * Insight de rodapé. Usa a escala default (100), porque `deriveTakeaway` só
 * recebe os DADOS — é o caso comum de progresso percentual.
 */
function deriveTakeaway(data: ScalarData): string[] | undefined {
  const value = toNumber(data?.value);
  if (value == null) return undefined;

  const fraction = value / DEFAULT_MAX;
  if (fraction >= 1) {
    return [`Meta atingida (${formatNumberBR(value)} de ${formatNumberBR(DEFAULT_MAX)})`];
  }

  return [
    `${formatPercentBR(fraction)} da meta (${formatNumberBR(value)} de ${formatNumberBR(DEFAULT_MAX)})`,
    `Faltam ${formatPercentBR(Math.max(0, 1 - fraction))} para a meta`,
  ];
}

export const definition = defineBlock<ProgressBarProps, ScalarData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;
