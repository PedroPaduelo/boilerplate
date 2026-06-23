/**
 * Bloco `metric_glow` (shape 'scalar') — usa o Vitrine `MetricGlowCard`.
 *
 * Props (padrão canônico do catálogo — ver `h_bar_chart`):
 *  - `label`: sobrescreve o título do card. Vazio → `data.label` → `manifest.name`.
 *  - `valueFormat`: ENUM FECHADO — normalizado por `formatValueByEnum()` de
 *    `format.ts`. Default `'compactBRL'`. SUBSTITUI o `toLocaleString` cru
 *    (ilegível em bilhões) que o bloco usava antes.
 *  - `accent`: cor do brilho/halo. `resolveAccent()` decide se vira classe
 *    Tailwind (chart-N, bg-purple-500) ou `style.background` (#hex, gradient).
 *  - `showDelta`: liga/desliga a variação percentual.
 *  - `deltaPolarity`: `up-good` (subir = verde, default) | `up-bad` (subir =
 *    vermelho). Inverte a lógica de cor da variação.
 *
 * NOTA: a prop `width` ficou de fora desta entrega (decisão pendente).
 */
import type { CSSProperties } from 'react';
import type { ScalarData } from '@dashboards/contracts';
import { MetricGlowCard } from '@/components/ui/metric-glow-card';
import { formatValueByEnum, formatPercentBR, type ValueFormat } from '@/shared/lib/format';
import { resolveAccent } from '../../lib/accent';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type DeltaPolarity = 'up-good' | 'up-bad';

type MetricGlowProps = {
  /** Sobrescreve o título do card. Vazio → `data.label` → `manifest.name`. */
  label?: string;
  /**
   * Formato do valor em destaque. ENUM FECHADO — default `'compactBRL'`.
   * Normalizado para string PT-BR via `formatValueByEnum()`. Substitui o
   * `toLocaleString` cru antigo.
   */
  valueFormat?: ValueFormat;
  /**
   * Cor do brilho/halo. Aceita enum DS (validado pelo schema), classe
   * Tailwind, cor CSS. Resolvido por `resolveAccent()`.
   */
  accent?: string;
  /** Mostra a variação percentual abaixo do valor (default `true`). */
  showDelta?: boolean;
  /**
   * Semântica de cor da variação. `up-good` (default): positiva = verde.
   * `up-bad`: positiva = vermelho.
   */
  deltaPolarity?: DeltaPolarity;
};

export const Component: BlockComponent<MetricGlowProps, ScalarData> = ({ props, data }) => {
  const value = data?.value ?? 0;
  const delta = data?.delta;

  // (valueFormat) substitui o toLocaleString cru — string PT-BR legível.
  const formattedValue = formatValueByEnum(value, props.valueFormat ?? 'compactBRL');

  // (label) override → data.label → manifest.name.
  const title = props.label?.trim() || data?.label || manifest.name;

  // (showDelta) liga/desliga a variação; só renderiza se houver delta.
  const showDelta = props.showDelta ?? true;
  const change =
    showDelta && delta != null
      ? `${delta >= 0 ? '+' : ''}${formatPercentBR(delta)}`
      : undefined;

  // (deltaPolarity) inverte a semântica verde/vermelho:
  //  - up-good: subir é bom  → verde quando delta >= 0.
  //  - up-bad:  subir é ruim → verde quando delta <= 0.
  const polarity = props.deltaPolarity ?? 'up-good';
  const positive = polarity === 'up-bad' ? (delta ?? 0) <= 0 : (delta ?? 0) >= 0;

  // (accent) halo do card — classe Tailwind (bg-…) OU style.background.
  const resolved = resolveAccent(props.accent);
  const glowClassName = resolved.kind === 'class' ? resolved.className : undefined;
  const glowStyle: CSSProperties | undefined =
    resolved.kind === 'style' ? resolved.style : undefined;

  return (
    <MetricGlowCard
      title={title}
      value={formattedValue}
      change={change}
      positive={positive}
      glowClassName={glowClassName}
      glowStyle={glowStyle}
    />
  );
};

export const definition = defineBlock<MetricGlowProps, ScalarData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
