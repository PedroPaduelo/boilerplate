/**
 * Bloco `signal_card` (shape 'series') — usa o Vitrine `SignalCard`.
 * Destaca o ÚLTIMO valor da série + mini-sparkline + badge de tendência.
 *
 * REESCRITA (consertos):
 *  - VALOR: formatado por `formatValueByEnum(last, props.valueFormat)` de
 *    `format.ts` (default `'compactNumber'`) — antes era
 *    `last.toLocaleString('pt-BR')` cru, ilegível em milhões/bilhões.
 *  - TENDÊNCIA: `trendBasis` controla a base —
 *    `'prev-vs-last'` (default) = (último − penúltimo)/penúltimo (variação
 *    mais recente, correta); `'first-vs-last'` = (último − primeiro)/primeiro
 *    (variação no período inteiro — comportamento antigo, agora opcional).
 *  - COR: `accent` pinta o TRAÇO da sparkline via `resolveAccentForStroke()`
 *    (classe `stroke-…` do DS ou `style.stroke` p/ cor CSS crua) — antes não
 *    havia cor configurável.
 *  - `showSparkline: false` esconde o mini-gráfico.
 */
import type { CSSProperties } from 'react';
import type { SeriesData } from '@dashboards/contracts';
import { SignalCard } from '@/components/ui/signal-card';
import { formatValueByEnum, type ValueFormat } from '@/shared/lib/format';
import { resolveAccentForStroke } from '../../lib/accent';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type SignalProps = {
  label?: string;
  /** Formato PT-BR do valor em destaque (enum fechado). Default 'compactNumber'. */
  valueFormat?: ValueFormat;
  /** Cor da sparkline (traço/preenchimento da série). Default 'chart-1'. */
  accent?: string;
  /** Subir é bom (verde) ou ruim (vermelho). Default 'up-good'. */
  trendPolarity?: 'up-good' | 'up-bad';
  /** Base do cálculo da tendência. Default 'prev-vs-last'. */
  trendBasis?: 'first-vs-last' | 'prev-vs-last';
  /** Mostra/esconde a mini-sparkline. Default true. */
  showSparkline?: boolean;
};

type SeriesPoint = { x: string | number; y: number | null; series?: string };

/**
 * Calcula a tendência (fração: 0.042 = +4,2%) conforme a base escolhida:
 *  - 'prev-vs-last' (default): (último − penúltimo)/|penúltimo| — variação
 *    mais recente. Precisa de ≥ 2 pontos e penúltimo ≠ 0.
 *  - 'first-vs-last': (último − primeiro)/|primeiro| — variação no período.
 *    Precisa de ≥ 2 pontos e primeiro ≠ 0.
 * Retorna `undefined` quando não há base válida (sem badge de tendência).
 */
function computeTrend(
  values: number[],
  basis: 'first-vs-last' | 'prev-vs-last',
): number | undefined {
  if (values.length < 2) return undefined;
  const last = values[values.length - 1];
  const base = basis === 'prev-vs-last' ? values[values.length - 2] : values[0];
  if (base === 0) return undefined;
  return (last - base) / Math.abs(base);
}

export const Component: BlockComponent<SignalProps, SeriesData> = ({ props, data }) => {
  const points = (data ?? []) as SeriesPoint[];
  const values = points.map((p) => p.y ?? 0);
  const last = values.length ? values[values.length - 1] : null;

  // VALOR — formatado em PT-BR via enum (default 'compactNumber'). `null`
  // (série vazia) cai no sentinel "—" dos helpers de format.ts.
  const displayValue = formatValueByEnum(last, props.valueFormat ?? 'compactNumber');

  // TENDÊNCIA — base configurável (prev-vs-last por default).
  const trend = computeTrend(values, props.trendBasis ?? 'prev-vs-last');

  // COR — pinta o TRAÇO da sparkline (nunca o fundo). `resolveAccentForStroke`
  // devolve { className: 'stroke-…' } (Tailwind/DS) ou { style: { stroke } }
  // (cor CSS crua).
  const resolvedAccent = resolveAccentForStroke(props.accent);
  const accentClassName: string | undefined =
    resolvedAccent.kind === 'class' ? resolvedAccent.className : undefined;
  const accentStyle: CSSProperties | undefined =
    resolvedAccent.kind === 'style' ? resolvedAccent.style : undefined;

  return (
    <SignalCard
      label={props.label ?? 'Sinal'}
      value={displayValue}
      data={values}
      trend={trend}
      trendPolarity={props.trendPolarity ?? 'up-good'}
      showSparkline={props.showSparkline ?? true}
      accentClassName={accentClassName}
      accentStyle={accentStyle}
    />
  );
};

export const definition = defineBlock<SignalProps, SeriesData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
