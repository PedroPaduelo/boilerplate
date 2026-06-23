/**
 * Bloco `progress_circle` (shape 'scalar') — usa o Vitrine `ProgressCircleTremor`.
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
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type ProgressCircleProps = {
  max?: number;
  variant?: 'default' | 'neutral' | 'warning' | 'error' | 'success';
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

  return (
    <div className="flex flex-col items-center gap-2 py-2">
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
              variant={props.variant}
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

export const definition = defineBlock<ProgressCircleProps, ScalarData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
