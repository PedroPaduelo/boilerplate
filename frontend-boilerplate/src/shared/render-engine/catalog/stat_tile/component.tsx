/**
 * Bloco `stat_tile` (shape 'scalar') — usa o Vitrine `StatTile`.
 *
 * Props (ver descrições no manifest):
 *  - `label`         → sobrescreve `data.label` (fallback: data.label → nome do bloco).
 *  - `valueFormat`   → formata `data.value` via `formatValueByEnum()` (enum FECHADO).
 *                      SUBSTITUI o antigo `CURRENCY_PREFIX` hardcoded por `data.unit`.
 *                      Default `'compactNumber'`. O valor formatado vai como
 *                      `displayValue` (render estático — evita o slot-machine do
 *                      AnimatedNumber ficar ilegível em valores grandes).
 *  - `accent`        → cor de destaque (barra lateral). `resolveAccent()` decide
 *                      classe Tailwind (`bg-chart-N`) ou `style.background`
 *                      (cor CSS crua como `#40E0D0`/gradient).
 *  - `showDelta`     → `false` esconde a variação (não passa `delta`).
 *  - `deltaPolarity` → `up-good` (subir verde) | `up-bad` (subir vermelho),
 *                      mapeado para `higherIsBetter` da UI base.
 *  - `hint`          → texto auxiliar (mantido).
 */
import type { ScalarData } from '@dashboards/contracts';
import { StatTile } from '@/components/ui/stat-tile';
import { formatValueByEnum, type ValueFormat } from '@/shared/lib/format';
import { resolveAccent } from '../../lib/accent';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type StatTileProps = {
  /** Sobrescreve o rótulo derivado de `data.label`. */
  label?: string;
  /**
   * Formato PT-BR do valor (enum FECHADO). Default `'compactNumber'`.
   * Substitui o `CURRENCY_PREFIX` hardcoded — `formatValueByEnum()` decide o
   * prefixo/sufixo/escala da string final.
   */
  valueFormat?: ValueFormat;
  /**
   * Cor de destaque (barra lateral). Aceita enum DS + classe Tailwind + cor
   * CSS. Resolvido por `resolveAccent()`.
   */
  accent?: string;
  /** Mostra a variação (delta). Default `true`. `false` esconde. */
  showDelta?: boolean;
  /** Polaridade do delta: `up-good` (subir verde) | `up-bad` (subir vermelho). */
  deltaPolarity?: 'up-good' | 'up-bad';
  /** Texto auxiliar exibido ao lado do delta. */
  hint?: string;
};

export const Component: BlockComponent<StatTileProps, ScalarData> = ({ props, data }) => {
  const value = data?.value ?? 0;

  // valueFormat → string formatada (substitui o CURRENCY_PREFIX hardcoded).
  // Default 'compactNumber'. Render estático via `displayValue`.
  const displayValue = formatValueByEnum(value, props.valueFormat ?? 'compactNumber');

  // showDelta: false esconde a variação. `data.delta` é FRAÇÃO (0.06 = +6%).
  const showDelta = props.showDelta ?? true;
  const delta =
    showDelta && data?.delta != null
      ? Math.round(data.delta * 1000) / 10
      : undefined;

  // deltaPolarity → higherIsBetter (up-good = subir é bom = verde).
  const higherIsBetter = (props.deltaPolarity ?? 'up-good') === 'up-good';

  // accent → barra lateral de destaque. resolveAccent() devolve classe
  // Tailwind (`bg-chart-N`) ou `style.background` (cor CSS crua / gradient).
  const resolvedAccent = resolveAccent(props.accent ?? 'chart-1');
  const accentClassName =
    resolvedAccent.kind === 'class' ? resolvedAccent.className : undefined;
  const accentStyle =
    resolvedAccent.kind === 'style' ? resolvedAccent.style : undefined;

  return (
    <StatTile
      label={props.label ?? data?.label ?? manifest.name}
      value={value}
      displayValue={displayValue}
      delta={delta}
      higherIsBetter={higherIsBetter}
      hint={props.hint}
      accentClassName={accentClassName}
      accentStyle={accentStyle}
    />
  );
};

export const definition = defineBlock<StatTileProps, ScalarData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
