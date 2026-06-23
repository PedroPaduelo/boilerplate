/**
 * Bloco `donut` (shape 'categorical') — usa o Vitrine `DonutChart` + legenda.
 * Mapeia {label,value} para segmentos com cores do palette de charts do DS.
 */
import { useState } from 'react';
import type { CategoricalData } from '@dashboards/contracts';
import { DonutChart } from '@/components/ui/donut-chart';
import { cn } from '@/shared/lib/utils';
import { formatCompactBRL, formatPercentBR } from '@/shared/lib/format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type DonutProps = {
  showLegend?: boolean;
  centerLabel?: string;
};

const STROKE_PALETTE = [
  'stroke-chart-1',
  'stroke-chart-2',
  'stroke-chart-3',
  'stroke-chart-4',
  'stroke-chart-5',
];
const BG_PALETTE = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5'];

/** Elemento de CategoricalData anotado localmente (FromSchema resolve p/ any no FE). */
type CategoryPoint = { label: string; value: number | null };

export const Component: BlockComponent<DonutProps, CategoricalData> = ({ props, data }) => {
  const items = (data ?? []) as CategoryPoint[];
  const [hovered, setHovered] = useState<number | null>(null);
  const segments = items.map((d, i) => ({
    label: d.label,
    value: d.value ?? 0,
    className: STROKE_PALETTE[i % STROKE_PALETTE.length],
  }));
  const total = items.reduce((acc, d) => acc + (d.value ?? 0), 0) || 1;
  const showLegend = props.showLegend !== false;
  const active = hovered != null ? items[hovered] : null;

  return (
    <div data-slot="block-donut" className="flex flex-wrap items-center gap-6">
      <div className="relative shrink-0">
        <DonutChart
          segments={segments}
          activeIndex={hovered}
          onSegmentHover={setHovered}
        />
        <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          {active ? (
            <>
              <span className="line-clamp-2 text-[10px] leading-tight text-muted-foreground">
                {active.label}
              </span>
              <span className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                {formatCompactBRL(active.value ?? 0)}
              </span>
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {formatPercentBR((active.value ?? 0) / total)}
              </span>
            </>
          ) : (
            <>
              <span className="text-[11px] text-muted-foreground">Total</span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {props.centerLabel ?? formatCompactBRL(total)}
              </span>
            </>
          )}
        </span>
      </div>
      {showLegend ? (
        <ul data-slot="block-donut-legend" className="flex min-w-0 flex-1 flex-col gap-1.5">
          {items.map((d, i) => {
            const value = d.value ?? 0;
            const isActive = hovered === i;
            return (
              <li
                key={`${d.label}-${i}`}
                className={cn(
                  'flex cursor-default items-center gap-2 rounded-md px-1.5 py-0.5 text-sm transition-colors',
                  isActive ? 'bg-muted' : 'hover:bg-muted/50',
                )}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <span
                  className={cn(
                    'inline-block size-2.5 shrink-0 rounded-full',
                    BG_PALETTE[i % BG_PALETTE.length],
                  )}
                />
                <span className="min-w-0 flex-1 truncate text-muted-foreground" title={d.label}>
                  {d.label}
                </span>
                <span className="shrink-0 font-medium tabular-nums text-foreground">
                  {formatCompactBRL(value)}
                </span>
                <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {formatPercentBR(value / total)}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
};

export const definition = defineBlock<DonutProps, CategoricalData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
