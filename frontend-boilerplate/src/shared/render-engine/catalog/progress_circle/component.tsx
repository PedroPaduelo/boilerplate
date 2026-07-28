/**
 * Bloco `progress_circle` (shape 'scalar') — progresso em anel, sobre o
 * `ProgressCircle` de `@/shared/ui` e o `Tooltip` do Astryx.
 *
 * ---------------------------------------------------------------------------
 * CONFORMIDADE VISUAL — vocabulário dos circulares da referência
 * (`03-tipos-de-grafico.md` §10 Rosca + §11–§13 medidores) · lote SUB-06
 * ---------------------------------------------------------------------------
 * n/a 1. Grade só horizontal, tracejada 3 — anel NÃO tem grade (§9 do
 *        checklist: "pizza/rosca/medidor sem eixos e sem grade").
 * n/a 2. Eixos sem linha e sem marcações — anel não tem eixo.
 * n/a 3. Texto dos eixos 12px/400 — não há rótulo de eixo.
 * n/a 4. Linha 2,5px com curva suave — regra dos gráficos de linha.
 * n/a 5. Coluna com raio 4px só no topo — regra das colunas.
 * [x] 6. Hover ESCURECE: o anel não tem estado de hover (uma fatia); a leitura
 *        completa vem do `Tooltip` do DS, que não clareia o desenho.
 * n/a 7. Tooltip branco 90% com desfoque — este é o `Tooltip` do DS, sobre o
 *        bloco inteiro, não o tooltip de série do gráfico.
 * [x] 8. VOLTA COMPLETA (0 → 360) começando no topo, sentido horário.
 * [x] 9. TAMANHO 240×240 (`CHART_HEIGHT.circular`), o dos circulares.
 * [x] 10. ESPESSURA DO ANEL de 24px (`CHART_GEOMETRY.ringThickness`, via
 *         `chartRingInnerRadius`) — a MESMA da rosca e dos três medidores. Era
 *         o furo de 72% da rosca, que aqui dava 30px de anel enquanto a rosca
 *         dava 34 e o medidor 88.
 * [x] 11. TRILHA `rgba(145,158,171,.16)` — `chrome('track')`, a trilha de
 *         medidor radial da base (§10) — com a MESMA espessura do arco de
 *         valor: a trilha é o anel apagado, muda de cor e nunca de espessura.
 * [x] 12. RÓTULOS CENTRAIS da rosca: valor 17,5px/700 na cor de ênfase e
 *         "Total" 12,25px/600 na cor de rótulo (`01-fundamentos.md` §4).
 * [x] 13. Ponta ARREDONDADA do arco (base §6) — some quando o anel fecha.
 * [x] 14. Modo `sparkline`: sem eixo, sem grade e sem padding; esqueleto
 *         REDONDO no carregamento (`01-fundamentos.md` §8).
 * [x] 15. Animação de entrada 360ms (`chartAnimationProps`).
 * [x] 16. Zero hex/rgb/px de estilo neste arquivo: cor, métrica e tipografia
 *         saem de `useChartPalette` dentro do `ProgressCircle`.
 *
 * ---------------------------------------------------------------------------
 * CONTRATO COMUM (briefing §5)
 * ---------------------------------------------------------------------------
 *  - CABEÇALHO: desenhado pelo `BlockFrame`. O bloco NÃO repete título dentro
 *    do gráfico;
 *  - DADOS: `data` no shape `scalar` (`{value, label?}`) — o valor vira o
 *    percentual do anel e o rótulo vira o "Total" central;
 *  - MARKDOWN + `{{interpolação}}`: rótulo acessível, leitura central e rótulo
 *    central passam por `chartPlainText(texto, scope)`, com
 *    `scope = buildChartScope(data)`;
 *  - ESTADOS: `loading`/`skeleton` → esqueleto redondo; `error` → aviso de
 *    erro; valor não numérico → estado vazio. Tudo do `ChartFrame`;
 *  - PARÂMETROS: `max`, `variant` e `accent` continuam com o mesmo nome, tipo
 *    e efeito.
 *
 * COR: `variant` é TOM semântico do anel (destaque, positivo, atenção,
 * negativo, neutro) e `accent`, quando preenchido, significa "use o tom de
 * destaque" — o anel do DS é pintado por tom, não por cor arbitrária.
 *
 * O tooltip é o do design system: ele já cuida de foco, teclado e
 * posicionamento, então o bloco não precisa de `tabIndex` nem de anel de foco
 * próprio.
 */
import type { ScalarData } from '@dashboards/contracts';
import { Tooltip } from '@astryxdesign/core/Tooltip';
import { VStack } from '@astryxdesign/core/VStack';
import { CHART_HEIGHT, ProgressCircle, buildChartScope } from '@/shared/ui';
import type { ProgressCircleTone } from '@/shared/ui';
import { formatNumberBR, formatPercentBR, toNumber } from '@/shared/lib/format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type ProgressCircleProps = {
  max?: number;
  variant?: 'default' | 'neutral' | 'warning' | 'error' | 'success';
  /** Cor do arco (ver manifest): preenchida, usa o tom de destaque. */
  accent?: string;
};

/** Vocabulário antigo → tom semântico do anel. */
const TONE: Record<string, ProgressCircleTone> = {
  default: 'accent',
  neutral: 'neutral',
  warning: 'warning',
  error: 'negative',
  success: 'positive',
};

/** Rótulo central quando o dado não traz um nome — o "Total" da referência. */
const TOTAL_LABEL = 'Total';

export const Component: BlockComponent<ProgressCircleProps, ScalarData> = ({
  props,
  data,
  state,
  error,
}) => {
  // Valor ausente/não numérico vira `NaN` de propósito: o `ChartFrame` mostra
  // "sem dados" em vez de um anel cravado em zero, que mentiria a leitura.
  const raw = toNumber(data?.value);
  const value = raw ?? Number.NaN;
  const rawMax = props.max ?? 100;
  const max = rawMax > 0 ? rawMax : 100;
  const fraction = Math.min(1, Math.max(0, value / max));

  // Com a escala default o valor JÁ é um percentual; com escala própria, a
  // leitura precisa dizer de quanto — senão "73%" de 1.000 fica sem referência.
  const percentLabel = formatPercentBR(fraction);
  const reading =
    max === 100
      ? percentLabel
      : `${percentLabel} (${formatNumberBR(value)} de ${formatNumberBR(max)})`;

  const hasAccent = typeof props.accent === 'string' && props.accent.trim() !== '';
  const tone = hasAccent ? 'accent' : (TONE[props.variant ?? 'default'] ?? 'accent');
  const label = data?.label ?? manifest.name;
  // Vocabulário de `{{variáveis}}` derivado dos DADOS — o mesmo em todo bloco.
  const scope = buildChartScope(data ?? {});

  const ring = (
    <VStack width="100%" hAlign="center">
      <ProgressCircle
        value={value}
        max={max}
        size={CHART_HEIGHT.circular}
        tone={tone}
        label={label}
        centerValue={percentLabel}
        centerCaption={data?.label ?? TOTAL_LABEL}
        // O equivalente textual só entra quando ACRESCENTA algo à leitura
        // central (a escala própria); repetir "75%" faria o leitor de tela
        // anunciar o mesmo número duas vezes.
        summary={reading === percentLabel ? undefined : reading}
        scope={scope}
        state={state === 'error' ? 'error' : undefined}
        isLoading={state === 'loading' || state === 'skeleton'}
        errorMessage={error}
      />
    </VStack>
  );

  // Sem valor não há leitura para o tooltip repetir — e um tooltip vazio sobre
  // o aviso de "sem dados" só atrapalharia quem navega por teclado.
  return raw == null ? (
    ring
  ) : (
    <Tooltip content={data?.label ? `${data.label}: ${reading}` : reading}>
      {ring}
    </Tooltip>
  );
};

/**
 * Insight de rodapé: percentual concluído. Usa a escala default (100), porque
 * `deriveTakeaway` só recebe os DADOS.
 */
function deriveTakeaway(data: ScalarData): string[] | undefined {
  const value = toNumber(data?.value);
  if (value == null) return undefined;
  return [`${formatPercentBR(Math.min(1, Math.max(0, value / 100)))} concluído`];
}

export const definition = defineBlock<ProgressCircleProps, ScalarData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;
