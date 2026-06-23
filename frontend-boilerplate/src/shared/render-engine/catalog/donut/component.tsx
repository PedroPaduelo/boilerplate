/**
 * Bloco `donut` (shape 'categorical') — usa o Vitrine `DonutChart` + legenda.
 * Mapeia {label,value} para segmentos com cores do palette de charts do DS.
 */
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
  const segments = items.map((d, i) => ({
    label: d.label,
    value: d.value ?? 0,
    className: STROKE_PALETTE[i % STROKE_PALETTE.length],
  }));
  const total = items.reduce((acc, d) => acc + (d.value ?? 0), 0) || 1;
  const showLegend = props.showLegend !== false;

  return (
    <div data-slot="block-donut" className="flex flex-wrap items-center gap-6">
      <div className="relative shrink-0">
        <DonutChart segments={segments} />
        <span className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] text-muted-foreground">Total</span>
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {props.centerLabel ?? formatCompactBRL(total)}
          </span>
        </span>
      </div>
      {showLegend ? (
        <ul data-slot="block-donut-legend" className="flex min-w-0 flex-1 flex-col gap-1.5">
          {items.map((d, i) => {
            const value = d.value ?? 0;
            return (
              <li key={`${d.label}-${i}`} className="flex items-center gap-2 text-sm">
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
