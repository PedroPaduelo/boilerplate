/**
 * Bloco `progress_bar` (shape 'scalar') — barra de progresso. Usa o Vitrine
 * `ProgressBarTremor`. Agora vive na aba "Gráficos" (kind=chart, NÃO
 * self-contained) → recebe a moldura `ChartWidget` (header com o título do
 * card + footer). Por isso o componente NÃO desenha título próprio: a linha
 * acima da barra é o SUBLABEL do dado (`data.label`) + o percentual — um
 * detalhe do dado, distinto do título do card.
 *
 * COR (canônico — igual h_bar_chart): `variant` define cores SEMÂNTICAS
 * (default/neutral/warning/error/success). `accent` (string livre, resolvido
 * por `resolveAccent()`) aceita enum DS (chart-1..5/primary), classe Tailwind
 * (bg-purple-500) ou cor CSS crua (#40E0D0, rgb(), gradient).
 *
 *   REGRA: `accent`, quando PREENCHIDO, SOBRESCREVE o `variant` no
 *   preenchimento da barra. Vazio → usa as cores do `variant`.
 *
 * `showValue` (default true): mostra/esconde o "%" ao lado do label.
 *
 * `deriveTakeaway` (canônico): 1 insight ("68% da meta (68 de 100)" ou
 * "Faltam 32% para a meta"). NOTA: `deriveTakeaway` só recebe `data` (não
 * `props`), então usa a escala default (`max = 100`) — o caso comum de
 * progresso percentual.
 */
import type { CSSProperties } from 'react';
import type { ScalarData } from '@dashboards/contracts';
import { ProgressBarTremor } from '@/components/ui/progress-bar-tremor';
import { formatNumberBR, formatPercentBR } from '@/shared/lib/format';
import { resolveAccent } from '../../lib/accent';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type ProgressBarProps = {
  /** Valor máximo (escala) usado para calcular o %. Default: 100. */
  max?: number;
  /** Cores semânticas do preenchimento + trilho. Sobrescrito por `accent`. */
  variant?: 'default' | 'neutral' | 'warning' | 'error' | 'success';
  /**
   * Cor custom do preenchimento. Quando preenchida, SOBRESCREVE o `variant`.
   * Aceita enum DS (chart-1..5/primary), classe Tailwind ou cor CSS crua.
   * Resolvida por `resolveAccent()` → `{ className }` (Tailwind) ou
   * `{ style: { background } }` (CSS).
   */
  accent?: string;
  /** Mostra (default) ou esconde o "%" ao lado do label. */
  showValue?: boolean;
};

/** Escala default do progresso quando `max` não vem nas props. */
const DEFAULT_MAX = 100;

export const Component: BlockComponent<ProgressBarProps, ScalarData> = ({ props, data }) => {
  const value = data?.value ?? 0;
  const max = props.max ?? DEFAULT_MAX;
  const showValue = props.showValue ?? true;
  const pct = max ? (value / max) * 100 : 0;

  // accent custom SOBRESCREVE o variant. Vazio → resolveAccent não é aplicado
  // (deixa o variant da UI base mandar).
  const hasAccent = typeof props.accent === 'string' && props.accent.trim() !== '';
  const resolved = hasAccent ? resolveAccent(props.accent) : null;
  const barClassName: string | undefined =
    resolved?.kind === 'class' ? resolved.className : undefined;
  const barStyle: CSSProperties | undefined =
    resolved?.kind === 'style' ? resolved.style : undefined;

  return (
    <div className="space-y-2">
      {data?.label || showValue ? (
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="truncate text-muted-foreground">{data?.label ?? ''}</span>
          {showValue ? (
            <span className="font-medium tabular-nums text-foreground">
              {Math.round(pct)}%
            </span>
          ) : null}
        </div>
      ) : null}
      <ProgressBarTremor
        value={value}
        max={max}
        variant={props.variant}
        barClassName={barClassName}
        barStyle={barStyle}
        showAnimation
      />
    </div>
  );
};

/**
 * Insight de rodapé (canônico): 1 frase curta sobre o progresso. Usa a escala
 * default (`max = 100`) porque `deriveTakeaway` só recebe `data` (não `props`)
 * — é o caso comum de progresso percentual.
 *  - progresso < 100% → "68% da meta (68 de 100)".
 *  - progresso ≥ 100% → "Meta atingida (100 de 100)".
 *  - SE faltar pouco (< 100%) também adiciona "Faltam 32% para a meta".
 */
function deriveTakeaway(data: ScalarData): string[] | undefined {
  const value = data?.value;
  if (value == null || !Number.isFinite(value)) return undefined;

  const max = DEFAULT_MAX;
  const fraction = max ? value / max : 0;
  const remaining = Math.max(0, 1 - fraction);

  if (fraction >= 1) {
    return [`Meta atingida (${formatNumberBR(value)} de ${formatNumberBR(max)})`];
  }

  return [
    `${formatPercentBR(fraction)} da meta (${formatNumberBR(value)} de ${formatNumberBR(max)})`,
    `Faltam ${formatPercentBR(remaining)} para a meta`,
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
