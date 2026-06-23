/**
 * Bloco `donut` (shape 'categorical') — usa o Vitrine `DonutChart` + legenda.
 * Mapeia {label,value} para segmentos com cores do palette de charts do DS.
 *
 * ── ENTREGA 1 — Cor custom (alinhada ao `h_bar_chart`) ────────────────────────
 * Prop `accent` aceita enum DS + string custom (resolvido por
 * `resolveAccentForStroke()` em `lib/accent.ts`):
 *   - enum DS (chart-1..5 | 'primary') → classe Tailwind `stroke-chart-N`;
 *   - classe Tailwind (stroke-purple-500) → usa direto;
 *   - cor CSS crua (#40E0D0, rgb(), gradient) → `style.stroke` inline no arco.
 *
 * Modo de aplicação (`palette`):
 *   - `single` (default) → TODAS as fatias na MESMA cor (accent). Como um donut
 *     monocromático fica indistinguível, variamos a OPACIDADE por fatia
 *     (`strokeOpacity`, da fatia 0 = 1.0 até a última ≈ 0.45) — a cor base é
 *     respeitada e as fatias continuam legíveis. Usamos `strokeOpacity` (não
 *     `opacity`) de propósito: o realce de hover do `DonutChart` usa `opacity`
 *     (classe `opacity-40`) p/ esmaecer as fatias inativas; como são
 *     propriedades SVG independentes, os dois efeitos coexistem sem conflito.
 *   - `multi` → cicla a paleta (chart-1..5) por categoria via
 *     `paletteStrokeClass(i)`. **ENTREGA 1**: o accent custom é IGNORADO neste
 *     modo (a paleta cíclica do DS vence), igual ao `h_bar_chart`.
 *   - `none` → SEM cor (não passa className/style; o arco herda `currentColor`,
 *     sem distinção entre fatias).
 *
 * ── ENTREGA 3 — Center label (total / hover) ──────────────────────────────────
 * O vão central do donut mostra:
 *   - SEM hover → `centerLabel` (default "Total") + VALOR TOTAL (soma das
 *     fatias, formatado por `valueFormat`).
 *   - COM hover → label da fatia + valor da fatia + % do total.
 * `valueFormat` (ENUM FECHADO, default `'compactBRL'`) normaliza o valor via
 * `formatValueByEnum()` de `format.ts` (usado também na legenda).
 *
 * `deriveTakeaway` (canônico — Turno 4): retorna 1-2 frases curtas:
 *  - SEMPRE a 1ª: "Maior fatia: {label} ({pct}%)".
 *  - OPCIONAL 2ª: "Menor fatia: {label} ({pct}%)" — só se houver +1 fatia.
 */
import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { CategoricalData } from '@dashboards/contracts';
import { DonutChart, type DonutSegment } from '@/components/ui/donut-chart';
import { cn } from '@/shared/lib/utils';
import {
  formatPercentBR,
  formatValueByEnum,
  type ValueFormat,
} from '@/shared/lib/format';
import { resolveAccentForStroke, paletteStrokeClass, paletteClass } from '../../lib/accent';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type DonutProps = {
  showLegend?: boolean;
  centerLabel?: string;
  palette?: 'single' | 'multi' | 'none';
  /**
   * Cor base aplicada aos segmentos (só usado em palette="single"; em "multi"
   * a paleta cíclica do DS vence — ver ENTREGA 1 no header).
   * Aceita enum DS (validado pelo schema), classe Tailwind, cor CSS.
   * Resolvido por `resolveAccentForStroke()` em `lib/accent.ts`.
   */
  accent?: string;
  /**
   * (ENTREGA 3) Formato do valor exibido no centro (total/fatia) + legenda.
   * ENUM FECHADO — default `'compactBRL'`. O component normaliza via
   * `formatValueByEnum()` de `format.ts`. Sem input livre — o schema trava
   * o domínio.
   */
  valueFormat?: ValueFormat;
};

/** Elemento de CategoricalData anotado localmente (FromSchema resolve p/ any no FE). */
type CategoryPoint = { label: string; value: number | null };

/**
 * Opacidade da fatia `index` (de `count`) no modo `single`. Ramp linear de
 * 1.0 (1ª fatia) até `MIN_OPACITY` (última) — mantém a cor base única, mas
 * deixa as fatias distinguíveis num donut monocromático. 1 só fatia → 1.0.
 */
const MIN_SINGLE_OPACITY = 0.45;
function singleSliceOpacity(index: number, count: number): number {
  if (count <= 1) return 1;
  const t = index / (count - 1); // 0..1
  return 1 - t * (1 - MIN_SINGLE_OPACITY);
}

export const Component: BlockComponent<DonutProps, CategoricalData> = ({ props, data }) => {
  const items = (data ?? []) as CategoryPoint[];
  const [hovered, setHovered] = useState<number | null>(null);

  // `resolveAccentForStroke()` devolve { className: 'stroke-…' } (Tailwind)
  // ou { style: { stroke } } (CSS custom). VENCE `className` quando ambos
  // vierem.
  const resolvedAccent = resolveAccentForStroke(props.accent);
  const palette = props.palette ?? 'single';
  const count = items.length;

  // (ENTREGA 3) valueFormat enum → formatador concreto. Default 'compactBRL'
  // (consistente com o histórico do bloco — antes usava `formatCompactBRL`).
  const valueFormatter = (v: number) =>
    formatValueByEnum(v, props.valueFormat ?? 'compactBRL');

  // ── Segmentos (ENTREGA 1) ──────────────────────────────────────────────
  // single → mesma cor (accent) + opacidade por fatia.
  // multi  → cicla a paleta do DS (accent custom IGNORADO).
  // none   → sem cor (currentColor herdado).
  // Soma real (display) e denominador p/ percentuais (evita /0).
  const rawTotal = items.reduce((acc, d) => acc + (d.value ?? 0), 0);
  const denom = rawTotal || 1;

  const segments: DonutSegment[] = items.map((d, i) => {
    const value = d.value ?? 0;
    // Tooltip nativo do arco com o valor JÁ formatado (consistente com o
    // centro/legenda).
    const title = `${d.label}: ${valueFormatter(value)} (${formatPercentBR(value / denom)})`;
    if (palette === 'single') {
      const opacity = singleSliceOpacity(i, count);
      if (resolvedAccent.kind === 'style') {
        // CSS custom (#hex/rgb/gradient): style.stroke vence className.
        return { label: d.label, value, title, style: { ...resolvedAccent.style, strokeOpacity: opacity } };
      }
      // Enum DS / classe Tailwind: className + opacidade via style (sem
      // `stroke`, p/ não anular a classe no DonutChart).
      return { label: d.label, value, title, className: resolvedAccent.className, style: { strokeOpacity: opacity } };
    }
    if (palette === 'multi') {
      return { label: d.label, value, title, className: paletteStrokeClass(i) };
    }
    // none → sem className/style (arco herda currentColor).
    return { label: d.label, value, title };
  });
  const showLegend = props.showLegend !== false;
  const active = hovered != null ? items[hovered] : null;
  // ENTREGA 2: 6+ categorias → legenda em grade de 2 colunas (com rolagem).
  const manyItems = count > 5;

  return (
    <div data-slot="block-donut" className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
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
                {valueFormatter(active.value ?? 0)}
              </span>
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {formatPercentBR((active.value ?? 0) / denom)}
              </span>
            </>
          ) : (
            <>
              <span className="text-[11px] text-muted-foreground">
                {props.centerLabel ?? 'Total'}
              </span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {valueFormatter(rawTotal)}
              </span>
            </>
          )}
        </span>
      </div>
      {showLegend ? (
        <ul
          data-slot="block-donut-legend"
          className={cn(
            // ENTREGA 2: grade com colunas de largura LIMITADA (não estica o
            // card largo — o valor fica perto do nome, sem vão gigante).
            // Listas longas viram 2 colunas + rolagem vertical contida.
            'grid min-w-0 max-h-[220px] gap-x-6 gap-y-1 overflow-y-auto',
            manyItems
              ? 'grid-cols-[repeat(2,minmax(7rem,13rem))]'
              : 'grid-cols-[minmax(7rem,16rem)]',
          )}
        >
          {items.map((d, i) => {
            const value = d.value ?? 0;
            const isActive = hovered === i;
            // Bolinha da legenda — espelha a cor/opacidade do segmento:
            //  single → accent (style ou className) + opacidade da fatia;
            //  multi  → cicla a paleta;
            //  none   → tom neutro (muted).
            let legendDotClassName: string | undefined;
            let legendDotStyle: CSSProperties | undefined;
            if (palette === 'single') {
              const opacity = singleSliceOpacity(i, count);
              if (resolvedAccent.kind === 'style') {
                // SVG usa style.stroke; a bolinha (div HTML) precisa de
                // backgroundColor. Derivamos a cor do stroke.
                const stroke = resolvedAccent.style.stroke;
                if (typeof stroke === 'string') {
                  legendDotStyle = { backgroundColor: stroke, opacity };
                } else {
                  legendDotClassName = paletteClass(0);
                  legendDotStyle = { opacity };
                }
              } else {
                legendDotClassName = resolvedAccent.className.replace(/^stroke-/, 'bg-');
                legendDotStyle = { opacity };
              }
            } else if (palette === 'multi') {
              legendDotClassName = paletteClass(i);
            } else {
              // none → bolinha neutra (sem cor de fatia).
              legendDotClassName = 'bg-muted-foreground/40';
            }
            return (
              <li
                key={`${d.label}-${i}`}
                className={cn(
                  'flex min-w-0 cursor-default items-center gap-2 rounded-md px-1.5 py-0.5 text-sm transition-colors',
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
                  {valueFormatter(value)}
                </span>
                <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {formatPercentBR(value / denom)}
                </span>
              </li>
            );
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
