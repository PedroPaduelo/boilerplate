/**
 * Bloco `donut` (shape 'categorical') — usa o Vitrine `DonutChart` + legenda.
 * Mapeia {label,value} para segmentos com cores do palette de charts do DS.
 *
 * Prop de COR (Turno 5 — canônico): `accent` aceita enum DS + string custom
 * (resolvido por `resolveAccentForStroke()` em `lib/accent.ts`):
 *   - enum DS (chart-1..5 | 'primary') → classe Tailwind `stroke-chart-N`
 *     (regra CSS do tema resolve `var(--color-chart-1)`);
 *   - classe Tailwind (stroke-purple-500) → derivamos `stroke-purple-500`;
 *   - cor CSS crua (#40E0D0, rgb(), gradient) → `style.stroke` inline no
 *     arco (atributo de apresentação SVG vence a classe CSS).
 *
 * Modo de aplicação:
 *   - `palette: 'single'` (default) → TODAS as fatias com a mesma cor (accent).
 *   - `palette: 'multi'` → cicla STROKE_PALETTE / BG_PALETTE por categoria
 *     (cores diferentes por fatia). `accent` vira fallback se houver 1 só.
 *   - `palette: 'none'` → sem distinção de cor (deixa a palette cíclica padrão).
 *
 * `palette: 'multi'` warning (Turno 5 — replicado do bar_chart): `palette:
 * 'multi'` é aceito pelo schema e o DonutChart JÁ cicla nativamente por
 * fatia. Diferente do `bar_chart` (single-série na Vitrine), o `donut` JÁ
 * implementa multi-fatia — então NÃO precisa de warn. Mantido no schema
 * para simetria com os outros blocos.
 *
 * `deriveTakeaway` (canônico — Turno 4): retorna 1-2 frases curtas:
 *  - SEMPRE a 1ª: "Maior fatia: {label} ({pct}%)".
 *  - OPCIONAL 2ª: "Menor fatia: {label} ({pct}%)" — só se houver +1 fatia.
 */
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { CategoricalData } from '@dashboards/contracts';
import { DonutChart, type DonutSegment } from '@/components/ui/donut-chart';
import { cn } from '@/shared/lib/utils';
import { formatCompactBRL, formatPercentBR } from '@/shared/lib/format';
import { resolveAccentForStroke } from '../../lib/accent';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type DonutProps = {
  showLegend?: boolean;
  centerLabel?: string;
  palette?: 'single' | 'multi' | 'none';
  /**
   * Cor base aplicada aos segmentos (só usado em palette="single").
   * Aceita enum DS (validado pelo schema), classe Tailwind, cor CSS.
   * Resolvido por `resolveAccentForStroke()` em `lib/accent.ts`.
   */
  accent?: string;
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

  // `resolveAccentForStroke()` devolve { className: 'stroke-…' } (Tailwind)
  // ou { style: { stroke } } (CSS custom). VENCE `className` quando ambos
  // vierem.
  const resolvedAccent = resolveAccentForStroke(props.accent);
  const palette = props.palette ?? 'single';

  // Modo single: aplica accent em TODOS os segmentos (mesma cor).
  // Modo multi: cicla STROKE_PALETTE / BG_PALETTE por categoria.
  const isSingle = palette === 'single';
  const segments: DonutSegment[] = items.map((d, i) => {
    if (isSingle) {
      // SINGLE: aplica accent (style ou className) em todos os segmentos.
      return {
        label: d.label,
        value: d.value ?? 0,
        className: resolvedAccent.kind === 'class' ? resolvedAccent.className : undefined,
        style: resolvedAccent.kind === 'style' ? resolvedAccent.style : undefined,
      };
    }
    // MULTI/NONE: cicla palette por categoria.
    return {
      label: d.label,
      value: d.value ?? 0,
      className: STROKE_PALETTE[i % STROKE_PALETTE.length],
    };
  });
  const total = items.reduce((acc, d) => acc + (d.value ?? 0), 0) || 1;
  const showLegend = props.showLegend !== false;
  const active = hovered != null ? items[hovered] : null;

  // Warn em dev para `palette: 'multi'` quando accent for passado
  // (o accent é ignorado em multi — o usuário pode esquecer).
  const warnedMultiRef = useRef(false);
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      palette === 'multi' &&
      props.accent != null &&
      props.accent !== '' &&
      !warnedMultiRef.current
    ) {
      console.warn(
        '[donut] `accent` é ignorado quando `palette: "multi"` — a paleta cíclica vence. ' +
          'Use `palette: "single"` para forçar uma cor única (accent) em todos os segmentos.',
      );
      warnedMultiRef.current = true;
    }
  }, [palette, props.accent]);
  useEffect(() => {
    if (palette !== 'multi') warnedMultiRef.current = false;
  }, [palette]);

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
            // Bolinha da legenda: SINGLE usa accent (style ou className),
            // MULTI cicla BG_PALETTE por índice.
            let legendDotClassName: string | undefined
            let legendDotStyle: CSSProperties | undefined
            if (isSingle) {
              if (resolvedAccent.kind === 'style') {
                // SVG segment usa style.stroke; a bolinha da legenda (div
                // HTML) precisa de style.background. Derivamos a cor do
                // stroke pra usar como background.
                const stroke = resolvedAccent.style.stroke
                if (typeof stroke === 'string') {
                  legendDotStyle = { backgroundColor: stroke }
                } else {
                  legendDotClassName = BG_PALETTE[0]
                }
              } else {
                legendDotClassName = resolvedAccent.className
                  .replace(/^stroke-/, 'bg-') ?? BG_PALETTE[0]
              }
            } else {
              legendDotClassName = BG_PALETTE[i % BG_PALETTE.length]
            }
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
                    legendDotClassName,
                  )}
                  style={legendDotStyle}
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
            )
          })}
        </ul>
      ) : null}
    </div>
  );
};

/**
 * Insights de rodapé (canônico — Turno 4): retorna 1 ou 2 frases curtas:
 *  - SEMPRE a 1ª: "Maior fatia: {label} ({pct}%)".
 *  - OPCIONAL 2ª: "Menor fatia: {label} ({pct}%)" — só se houver +1 fatia
 *    e a menor for > 0 (evita mostrar "Menor: X (0%)" quando tudo é 0).
 * Retorno `string[]`; o BlockRenderer normaliza p/ o array
 * `{ enabled: true, text }[]` que o ChartWidget consome. PT-BR via
 * `formatPercentBR` (mesmo formatter do centro do donut).
 */
function deriveTakeaway(data: CategoricalData): string[] | undefined {
  const items = (data ?? []) as CategoryPoint[];
  if (items.length === 0) return undefined;

  const total = items.reduce((acc, d) => acc + (d.value ?? 0), 0) || 1;
  const top = items.reduce((best, d) =>
    (d.value ?? 0) > (best.value ?? 0) ? d : best,
  );
  if ((top.value ?? 0) <= 0) return undefined;

  const insights: string[] = [
    `Maior fatia: ${top.label} (${formatPercentBR((top.value ?? 0) / total)})`,
  ];

  if (items.length > 1) {
    const bottom = items.reduce((best, d) =>
      (d.value ?? 0) < (best.value ?? 0) ? d : best,
    );
    if ((bottom.value ?? 0) > 0 && bottom !== top) {
      insights.push(
        `Menor fatia: ${bottom.label} (${formatPercentBR((bottom.value ?? 0) / total)})`,
      );
    }
  }

  return insights;
}

export const definition = defineBlock<DonutProps, CategoricalData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;