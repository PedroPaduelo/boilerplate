/**
 * Bloco `progress_circle` (shape 'scalar') — usa o Vitrine `ProgressCircleTremor`.
 *
 * FORMATO DE GRÁFICO (movido p/ a aba "Gráficos", agora recebe a moldura
 * `ChartWidget` — header com título + footer com SQL/duração). O componente
 * apenas desenha o anel centralizado dentro da moldura; o título vem do
 * ChartWidget. O `data.label` (quando existe) aparece como SUBLABEL abaixo do
 * anel. O `%` fica no centro do anel.
 *
 * Prop de COR (canônico — igual aos 8 gráficos): `accent` (string livre)
 * resolvida por `resolveAccentForStroke()` em `lib/accent.ts` (o arco é um
 * `stroke` de SVG, não `background`):
 *   - enum DS (chart-1..5 | 'primary') → classe Tailwind `stroke-chart-N`;
 *   - classe Tailwind (`stroke-purple-500`) → usa direto;
 *   - cor CSS crua (#40E0D0, rgb(), gradient) → `style.stroke` inline.
 * Quando `accent` está PREENCHIDO, ele SOBRESCREVE o `variant` na cor do arco
 * (e o trilho passa a usar a cor neutra, p/ não misturar a paleta do variant).
 * Quando `accent` está VAZIO, vale o `variant` (default|neutral|warning|error|
 * success).
 *
 * Acessibilidade: o anel é envolvido por um wrapper `role="img"` com um
 * `aria-label` descritivo (percentual + escala em PT-BR), focável por teclado,
 * de modo que a informação NÃO depende só do tooltip visual. O próprio
 * `ProgressCircleTremor` também recebe `ariaLabel`/`ariaValuetext` (role
 * progressbar) como defesa em profundidade.
 *
 * Tooltip: ao passar o mouse (ou focar) mostra um card com o valor e o
 * percentual formatados (ex.: "73,4% (734 de 1.000)").
 */
import type { ScalarData } from '@dashboards/contracts';
import { ProgressCircleTremor } from '@/components/ui/progress-circle-tremor';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatNumberBR, formatPercentBR, toNumber } from '@/shared/lib/format';
import { resolveAccentForStroke } from '../../lib/accent';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type ProgressCircleProps = {
  max?: number;
  variant?: 'default' | 'neutral' | 'warning' | 'error' | 'success';
  /**
   * Cor do arco de progresso. Aceita enum DS (chart-1..5, primary), classe
   * Tailwind (stroke-purple-500) ou cor CSS (#40E0D0, rgb(), gradient).
   * Quando preenchido, SOBRESCREVE o `variant`.
   */
  accent?: string;
};

export const Component: BlockComponent<ProgressCircleProps, ScalarData> = ({ props, data }) => {
  const value = toNumber(data?.value) ?? 0;
  const rawMax = props.max ?? 100;
  const max = rawMax > 0 ? rawMax : 100;
  const fraction = Math.min(1, Math.max(0, value / max));
  const pct = Math.round(fraction * 100);

  // Strings PT-BR (nunca número cru no JSX).
  const pctLabel = formatPercentBR(fraction); // "73,4%"
  // Só explicita a escala "X de Y" quando há uma escala custom (max ≠ 100,
  // o default). Com max=100, o valor já É um percentual → mostra só "%".
  const hasExplicitScale = max !== 100;
  const valueDescription = hasExplicitScale
    ? `${pctLabel} (${formatNumberBR(value)} de ${formatNumberBR(max)})`
    : pctLabel;
  const ariaLabel = data?.label ? `${data.label}: ${valueDescription}` : valueDescription;

  // COR — `accent` custom (quando preenchido) SOBRESCREVE o `variant`. O arco
  // é um `stroke` de SVG → usamos `resolveAccentForStroke`. Quando há accent,
  // o trilho de fundo passa a `neutral` (cinza) p/ não misturar a paleta do
  // variant com a cor custom do arco.
  const hasAccent = props.accent != null && String(props.accent).trim() !== '';
  const resolvedAccent = hasAccent ? resolveAccentForStroke(props.accent) : null;
  const circleClassName =
    resolvedAccent?.kind === 'class' ? resolvedAccent.className : undefined;
  const circleStyle =
    resolvedAccent?.kind === 'style' ? resolvedAccent.style : undefined;
  const effectiveVariant = hasAccent ? 'neutral' : props.variant;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            role="img"
            aria-label={ariaLabel}
            tabIndex={0}
            className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ProgressCircleTremor
              value={value}
              max={max}
              radius={52}
              strokeWidth={9}
              variant={effectiveVariant}
              circleClassName={circleClassName}
              circleStyle={circleStyle}
              ariaLabel={ariaLabel}
              ariaValuetext={valueDescription}
            >
              <span className="text-xl font-semibold tabular-nums text-foreground">{pct}%</span>
            </ProgressCircleTremor>
          </div>
        </TooltipTrigger>
        <TooltipContent className="text-center">
          {data?.label ? <div className="font-medium">{data.label}</div> : null}
          <div className="tabular-nums">{valueDescription}</div>
        </TooltipContent>
      </Tooltip>
      {data?.label ? (
        <span className="text-sm text-muted-foreground">{data.label}</span>
      ) : null}
    </div>
  );
};

/**
 * Insight de rodapé (canônico): retorna 1 frase curta com o percentual de
 * conclusão em PT-BR. Como `deriveTakeaway` recebe só os dados (sem props), a
 * escala é o default (max=100 → o valor já é percentual). Ex.: "75% concluído".
 * Retorno `string[]`; o BlockRenderer normaliza p/ o array
 * `{ enabled: true, text }[]` que o ChartWidget consome.
 */
function deriveTakeaway(data: ScalarData): string[] | undefined {
  const value = toNumber(data?.value);
  if (value == null) return undefined;
  const fraction = Math.min(1, Math.max(0, value / 100));
  const pctLabel = formatPercentBR(fraction);
  return [`${pctLabel} concluído`];
}

export const definition = defineBlock<ProgressCircleProps, ScalarData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;
