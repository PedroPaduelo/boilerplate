/**
 * Bloco `radial_gauge` (shape 'scalar') — medidor radial sobre o `RadialGauge`
 * de `@/shared/ui`.
 *
 * ---------------------------------------------------------------------------
 * CONFORMIDADE VISUAL — `03-tipos-de-grafico.md` §12 (Medidor semicircular),
 * §11 (Barra radial) e §13 (Medidor tracejado) · lote SUB-06
 * ---------------------------------------------------------------------------
 * n/a 1. Grade só horizontal, tracejada 3 — medidor NÃO tem grade (§9 do
 *        checklist: "pizza/rosca/medidor sem eixos e sem grade").
 * n/a 2. Eixos sem linha e sem marcações — medidor não tem eixo.
 * n/a 3. Texto dos eixos 12px/400 — não há rótulo de eixo.
 * n/a 4. Linha 2,5px com curva suave — regra dos gráficos de linha.
 * n/a 5. Coluna com raio 4px só no topo — regra das colunas.
 * [x] 6. Hover ESCURECE: o medidor não tem estado de hover (uma fatia, sem
 *        tooltip); nada clareia.
 * n/a 7. Tooltip branco 90% com desfoque — o medidor lê o valor no centro.
 * [x] 8. ÂNGULOS: −90° → +90° no semicircular (recharts 180 → 0), volta
 *        completa na barra radial e −135° → +135° no tracejado.
 * [x] 9. TAMANHO: 260×260 (`CHART_HEIGHT.gauge`) no semicircular e no
 *        tracejado; 320×320 (`CHART_HEIGHT.radial`) na barra radial.
 * [x] 10. GRADIENTE entre o par de cores, paradas 0 → 100: roxo
 *         #8E33FF → #C684FF no semicircular (`purple` + tom `-light` da mesma
 *         família), vermelho #FF5630 → #FFAC82 no tracejado.
 * [x] 11. TRILHA: `rgba(145,158,171,.16)` (`chrome('track')`) no semicircular;
 *         `rgba(145,158,171,.08)` (`chrome('trackLight')`) na barra radial e no
 *         tracejado, este com a MESMA espessura da barra.
 * [x] 12. FURO: 32% na barra radial (`geometry.radialHole`); 50% nos demais
 *         (trilha de medidor da base, `geometry.trackWidth`).
 * [x] 13. TRACEJADO `dashArray: 4` com ponta reta na BARRA DE VALOR do §13 —
 *         nunca na trilha.
 * [x] 14. RÓTULOS CENTRAIS: valor 17,5px/700 (15,75px na barra radial);
 *         "Total" 10,5px/400 na cor de eixo (§12) e 12,25px/600 na cor de erro
 *         (§13).
 * [x] 15. LEGENDA PRÓPRIA embaixo na barra radial (`ChartLegends`, 11,375 +
 *         14,875) — a legenda nativa não é usada em medidores (§9 da base).
 * [x] 16. Modo `sparkline`: sem eixo, sem grade e sem padding; esqueleto
 *         REDONDO no carregamento (`01-fundamentos.md` §8).
 * [x] 17. Animação de entrada 360ms (`chartAnimationProps`).
 * [x] 18. Zero hex/rgb/px de estilo neste arquivo: cor, métrica e tipografia
 *         saem de `useChartPalette` dentro do `RadialGauge`.
 *
 * ---------------------------------------------------------------------------
 * CONTRATO COMUM (briefing §5)
 * ---------------------------------------------------------------------------
 *  - CABEÇALHO: desenhado pelo `BlockFrame`. O bloco NÃO repete título dentro
 *    do gráfico;
 *  - DADOS: `data` no shape `scalar` (`{value, label?, unit?}`) — o valor
 *    posiciona o arco, o rótulo vira o "Total" central e a unidade entra na
 *    leitura;
 *  - MARKDOWN + `{{interpolação}}`: rótulo acessível e rótulo central passam
 *    por `chartPlainText(texto, scope)`, com `scope = buildChartScope(data)`;
 *  - ESTADOS: `loading`/`skeleton` → esqueleto redondo; `error` → aviso de
 *    erro; valor não numérico → estado vazio. Tudo do `ChartFrame`;
 *  - PARÂMETROS: `max`, `min`, `unit` e `accent` continuam com o mesmo nome,
 *    tipo e efeito; `variant` foi acrescentada (opcional) para alcançar os
 *    outros dois medidores da referência.
 *
 * COR: `accent` continua aceitando o vocabulário antigo (`chart-1`,
 * `bg-purple-500`, `#40E0D0`), traduzido por `chartAccentColor()` para um token
 * do DS. No valor padrão do manifesto (`chart-1`) o medidor mantém o par de
 * cores do layout da referência — decisão registrada em `docs/charts/NOTAS.md`.
 */
import type { ScalarData } from '@dashboards/contracts';
import {
  CHART_HEIGHT,
  RadialGauge,
  buildChartScope,
  chartAccentColor,
} from '@/shared/ui';
import { formatNumberBR, formatPercentPointsBR, toNumber } from '@/shared/lib/format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

/** Layout do medidor — os três tipos de medidor da referência. */
type GaugeVariant = 'semicircle' | 'radial' | 'dashed';

type GaugeProps = {
  max?: number;
  min?: number;
  unit?: string;
  /** Cor do arco; resolvida para token de dado do DS. */
  accent?: string;
  /** Layout do medidor (ver manifest). */
  variant?: GaugeVariant;
};

/** Layouts aceitos — qualquer outro valor cai no padrão. */
const VARIANTS: readonly GaugeVariant[] = ['semicircle', 'radial', 'dashed'];

/** Rótulo central quando o dado não traz um nome — o "Total" da referência. */
const TOTAL_LABEL = 'Total';

/** Formata a leitura central conforme a unidade do dado. */
function readingFormatter(unit: string | undefined) {
  return (value: number): string => {
    if (unit === '%') return formatPercentPointsBR(value);
    return unit ? `${formatNumberBR(value)} ${unit}` : formatNumberBR(value);
  };
}

/** Layout pedido, ou o semicircular (§12) — o alvo deste bloco. */
function resolveVariant(variant: string | undefined): GaugeVariant {
  return VARIANTS.includes(variant as GaugeVariant)
    ? (variant as GaugeVariant)
    : 'semicircle';
}

/**
 * Cor do arco. O valor PADRÃO de `accent` significa "sem escolha": aí o
 * medidor usa o par de cores do layout da referência (roxo no semicircular,
 * vermelho no tracejado). Qualquer outro valor pinta o arco com a cor pedida.
 */
function resolveAccent(accent: string | undefined) {
  if (accent == null || accent === manifest.defaultProps.accent) return undefined;
  return chartAccentColor(accent);
}

export const Component: BlockComponent<GaugeProps, ScalarData> = ({
  props,
  data,
  state,
  error,
}) => {
  // Valor ausente/não numérico vira `NaN` de propósito: o `ChartFrame` mostra
  // "sem dados" em vez de um medidor cravado em zero, que mentiria a leitura.
  const value = toNumber(data?.value) ?? Number.NaN;
  const unit = props.unit ?? data?.unit;
  const variant = resolveVariant(props.variant);
  // Vocabulário de `{{variáveis}}` derivado dos DADOS — o mesmo em todo bloco.
  const scope = buildChartScope(data ?? {});

  return (
    <RadialGauge
      value={value}
      min={props.min ?? 0}
      max={props.max ?? 100}
      // §11 mede 320×320; §12 e §13, 260×260.
      size={variant === 'radial' ? CHART_HEIGHT.radial : CHART_HEIGHT.gauge}
      variant={variant}
      color={resolveAccent(props.accent)}
      label={data?.label ?? manifest.name}
      caption={data?.label ?? TOTAL_LABEL}
      valueFormatter={readingFormatter(unit)}
      scope={scope}
      state={state === 'error' ? 'error' : undefined}
      isLoading={state === 'loading' || state === 'skeleton'}
      errorMessage={error}
    />
  );
};

/** Insight de rodapé: a leitura do medidor, com rótulo e unidade do dado. */
function deriveTakeaway(data: ScalarData): string[] | undefined {
  const value = toNumber(data?.value);
  if (value == null) return undefined;

  const label = data?.label?.trim();
  const reading = readingFormatter(data?.unit?.trim())(value);
  return [label ? `${label}: ${reading}` : reading];
}

export const definition = defineBlock<GaugeProps, ScalarData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;
