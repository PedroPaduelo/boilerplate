/**
 * Bloco `kpi` (shape 'scalar') — usa o Vitrine `KpiCard`.
 * Co-exporta `Component` + `definition` (lido pelo auto-registro via glob).
 *
 * Props canônicas (ver manifest.ts para o schema MCP-ready):
 *  - `label`         → sobrescreve o rótulo do dado (`data.label`).
 *  - `valueFormat`   → 'auto' (default) mantém `formatKpiValue` (escolhe o
 *                      melhor display pela unidade/magnitude); os demais
 *                      FORÇAM o formato via `formatValueByEnum()`.
 *  - `accent`        → cor de destaque (rail lateral + chip do ícone),
 *                      resolvida por `resolveAccent()` (enum DS / classe
 *                      Tailwind / cor CSS crua). ANTES era IGNORADA — agora
 *                      é repassada ao `KpiCard` via `accentClassName`/
 *                      `accentStyle`.
 *  - `icon`          → nome de ícone lucide (PascalCase/kebab-case) resolvido
 *                      contra o registry `icons` do lucide-react.
 *  - `showDelta`     → mostra/esconde a variação.
 *  - `deltaPolarity` → 'up-good' (subir = verde) | 'up-bad' (subir = vermelho).
 *                      Mapeia para `higherIsBetter` do `KpiCard`.
 */
import type { ComponentType, CSSProperties } from 'react';
import { icons as lucideIcons } from 'lucide-react';
import type { ScalarData } from '@dashboards/contracts';
import { KpiCard } from '@/components/ui/kpi-card';
import {
  formatKpiValue,
  formatValueByEnum,
  type ValueFormat,
} from '@/shared/lib/format';
import { resolveAccent } from '../../lib/accent';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

/** 'auto' = formatKpiValue (display automático); demais = força o formato. */
type KpiValueFormat = 'auto' | ValueFormat;

type KpiProps = {
  label?: string;
  valueFormat?: KpiValueFormat;
  accent?: string;
  icon?: string;
  showDelta?: boolean;
  deltaPolarity?: 'up-good' | 'up-bad';
};

type LucideIconComponent = ComponentType<{ className?: string }>;

/**
 * Resolve um nome de ícone (PascalCase "DollarSign" ou kebab-case
 * "dollar-sign") contra o registry `icons` do lucide-react (chaves em
 * PascalCase). Retorna `undefined` se o nome não existir — o card renderiza
 * sem ícone (degradação suave em vez de quebrar).
 */
function resolveLucideIcon(name: string | undefined): LucideIconComponent | undefined {
  if (!name) return undefined;
  const raw = name.trim();
  if (!raw) return undefined;
  const registry = lucideIcons as Record<string, LucideIconComponent>;
  // 1) tenta o nome exato (já PascalCase).
  if (registry[raw]) return registry[raw];
  // 2) normaliza kebab/snake/space → PascalCase ("dollar-sign" → "DollarSign").
  const pascal = raw
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return registry[pascal];
}

export const Component: BlockComponent<KpiProps, ScalarData> = ({ props, data }) => {
  const value = data?.value ?? 0;
  const unit = data?.unit;

  // valueFormat: 'auto' (ou ausente) mantém o display automático histórico
  // (formatKpiValue — compacto para moeda/magnitudes altas); qualquer outro
  // valor FORÇA o formato via formatValueByEnum(). Renderizado ESTÁTICO no
  // card (sem slot-machine, que fica ilegível em bilhões).
  const valueFormat = props.valueFormat ?? 'auto';
  const displayValue =
    valueFormat === 'auto'
      ? formatKpiValue(value, unit)
      : formatValueByEnum(value, valueFormat);

  const showDelta = props.showDelta !== false;
  // dataContract trata `delta` como fração (0.12 = +12%); o KpiCard espera %.
  const delta =
    showDelta && data?.delta != null ? Math.round(data.delta * 1000) / 10 : undefined;

  // accent — ANTES IGNORADA. resolveAccent() devolve { className } (Tailwind
  // bg-…) OU { style: { background } } (cor CSS crua). Repassamos ao KpiCard
  // que aplica no rail lateral (sempre visível) e no chip do ícone.
  const resolvedAccent = resolveAccent(props.accent);
  const accentClassName: string | undefined =
    resolvedAccent.kind === 'class' ? resolvedAccent.className : undefined;
  const accentStyle: CSSProperties | undefined =
    resolvedAccent.kind === 'style' ? resolvedAccent.style : undefined;

  // deltaPolarity → higherIsBetter do KpiCard ('up-bad' = subir é ruim).
  const higherIsBetter = (props.deltaPolarity ?? 'up-good') !== 'up-bad';

  return (
    <KpiCard
      label={props.label ?? data?.label ?? manifest.name}
      value={value}
      displayValue={displayValue}
      delta={delta}
      icon={resolveLucideIcon(props.icon)}
      higherIsBetter={higherIsBetter}
      accentClassName={accentClassName}
      accentStyle={accentStyle}
    />
  );
};

export const definition = defineBlock<KpiProps, ScalarData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
