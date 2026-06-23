/**
 * Bloco `area_chart` (shape 'series', x temporal) — usa o Vitrine `AreaChart`
 * (SVG aderente ao tema, irmão do LineChart). Agrupa os pontos por `series`
 * (multi-série) preservando a ordem do eixo X e suporta empilhamento.
 *
 * Antes usava o `AreaChartTremor` (recharts), que vinha com cores/estilos
 * hardcoded fora do design system; agora a grade, eixos, tooltip e a paleta das
 * séries seguem os tokens do tema (`var(--chart-1..5)`, `border`, `popover`,
 * `muted-foreground`) e funcionam em light/dark.
 *
 * Prop de COR (Turno 5 — canônico): `accent` aceita enum DS + string custom
 * (resolvido por `resolveAccentForStroke()` em `lib/accent.ts`):
 *   - enum DS (chart-1..5 | 'primary') → `var(--chart-N)` no `stroke=` /
 *     `fill=` do polyline/polygon (cor literal no SVG, não classe Tailwind —
 *     o gradiente precisa de cor literal no `stop-color`).
 *   - classe Tailwind (bg-purple-500) → derivamos `purple-500` puro e
 *     aplicamos como CSS color (`stroke="purple-500"`);
 *   - cor CSS crua (#40E0D0, rgb(), gradient) → `style.stroke` / `style.fill`
 *     no polyline (atributo de apresentação que vence `stroke=`).
 *
 * Modo de aplicação:
 *   - `palette: 'multi'` (default) → cicla CHART_PALETTE por série, ignorando
 *     `accent` (vira fallback se houver 1 série só).
 *   - `palette: 'single'` → TODAS as séries com `accent`.
 *   - `palette: 'none'` → sem distinção (deixa o default).
 *
 * `deriveTakeaway` (canônico — Turno 4): retorna 1-2 frases curtas:
 *  - SEMPRE a 1ª: "Pico: {x} ({y})" — ponto de maior valor.
 *  - OPCIONAL 2ª: "Vale: {x} ({y})" — só se houver +1 ponto e o menor > 0.
 * (mesmo formato do line_chart — áreas são linhas preenchidas, mesmo insight
 * de tendência faz sentido).
 */
import type { CSSProperties } from 'react';
import type { SeriesData } from '@dashboards/contracts';
import { AreaChart, type AreaSeries, type AreaChartMode } from '@/components/ui/area-chart';
import {
  formatCompactNumberBR,
  formatBRL,
  formatPercentPointsBR,
} from '@/shared/lib/format';
import { resolveAccentForStroke } from '../../lib/accent';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type AreaProps = {
  type?: 'default' | 'stacked' | 'percent';
  fill?: 'gradient' | 'solid' | 'none';
  showLegend?: boolean;
  showGridLines?: boolean;
  palette?: 'single' | 'multi' | 'none';
  /**
   * Cor base da(s) série(s). Aceita enum DS (validado pelo schema), classe
   * Tailwind (`bg-purple-500`), cor CSS (`#40E0D0`, `var(--chart-1)`,
   * `linear-gradient(...)`). Resolvido por `resolveAccentForStroke()` em
   * `lib/accent.ts` — devolve `{ stroke: ... }` ou classe Tailwind.
   */
  accent?: string;
};

type SeriesPoint = { x: string | number; y: number | null; series?: string };

/** Converte SeriesData (long) em séries alinhadas ao eixo X + rótulos do X. */
export function toAreaSeries(
  data: SeriesData,
  options?: {
    /** Quando setado, força TODAS as séries a usarem essa cor (single-palette). */
    seriesStyle?: CSSProperties;
    /** Quando setado, força a cor base (`stroke`/`fill`) da série. */
    seriesColor?: string;
  },
): {
  series: AreaSeries[];
  xLabels: string[];
} {
  const points = (data ?? []) as SeriesPoint[];
  const xOrder: string[] = [];
  const groups = new Map<string, Map<string, number>>();
  for (const point of points) {
    const seriesName = point.series ?? 'Valor';
    const x = String(point.x);
    if (!xOrder.includes(x)) xOrder.push(x);
    if (!groups.has(seriesName)) groups.set(seriesName, new Map());
    groups.get(seriesName)!.set(x, point.y ?? 0);
  }
  const series: AreaSeries[] = [...groups.entries()].map(([label, byX]) => {
    // Modo SINGLE: força cor única (style vence color) em todas as séries.
    // Modo MULTI: cicla CHART_PALETTE por índice — usa `color: var(--chart-N)`.
    // Modo NONE: sem distinção (deixa o UI base usar a palette cíclica default).
    if (options?.seriesStyle) {
      return {
        label,
        data: xOrder.map((x) => byX.get(x) ?? 0),
        style: options.seriesStyle,
      };
    }
    if (options?.seriesColor) {
      return {
        label,
        data: xOrder.map((x) => byX.get(x) ?? 0),
        color: options.seriesColor,
      };
    }
    return {
      label,
      data: xOrder.map((x) => byX.get(x) ?? 0),
    };
  });
  return { series, xLabels: xOrder };
}

export const Component: BlockComponent<AreaProps, SeriesData> = ({ props, data }) => {
  // `resolveAccentForStroke()` devolve { stroke: ... } (CSS) ou
  // `{ className: 'stroke-…' }` (Tailwind). Aqui precisamos de cor LITERAL
  // (não classe), porque o polyline do SVG usa `stroke={color}` e o
  // gradiente usa a cor no `stop-color` (classe Tailwind não funciona).
  const resolvedAccent = resolveAccentForStroke(props.accent);
  let accentColor: string | undefined;
  let accentStyle: CSSProperties | undefined;
  if (resolvedAccent.kind === 'style') {
    accentStyle = resolvedAccent.style;
  } else {
    // classe Tailwind (`stroke-chart-1`) → derivamos o CSS var literal.
    const cls = resolvedAccent.className; // ex.: 'stroke-chart-1'
    if (cls.startsWith('stroke-')) {
      accentColor = `var(--${cls.slice(7)})`; // 'var(--chart-1)'
    } else {
      accentColor = cls; // fallback (raro)
    }
  }

  const palette = props.palette ?? 'multi';
  const { series, xLabels } = toAreaSeries(data ?? [], {
    seriesStyle: palette === 'single' ? accentStyle : undefined,
    seriesColor:
      palette === 'single' && !accentStyle ? accentColor : undefined,
  });

  const mode = (props.type ?? 'default') as AreaChartMode;
  const isPercent = mode === 'percent';
  return (
    <AreaChart
      series={series}
      xLabels={xLabels}
      mode={mode}
      fill={props.fill ?? 'gradient'}
      showLegend={props.showLegend !== false}
      showGrid={props.showGridLines !== false}
      // eixo Y: percentual no modo 100%, número compacto PT-BR caso contrário
      yValueFormatter={(v) => (isPercent ? formatPercentPointsBR(v) : formatCompactNumberBR(v))}
      // tooltip: valor real (cheio) de cada série, em BRL
      valueFormatter={(v) => formatBRL(v)}
    />
  );
};

/**
 * Insights de rodapé (canônico — Turno 4): retorna 1 ou 2 frases curtas:
 *  - SEMPRE a 1ª: "Pico: {x} ({y em BRL compacto})" — ponto de maior valor.
 *  - OPCIONAL 2ª: "Vale: {x} ({y em BRL compacto})" — só se houver +1 ponto
 *    E o menor valor for > 0.
 * Retorno `string[]`; o BlockRenderer normaliza p/ o array
 * `{ enabled: true, text }[]` que o ChartWidget consome. PT-BR via
 * `formatCompactNumberBR` (mesma forma do `line_chart`).
 */
function deriveTakeaway(data: SeriesData): string[] | undefined {
  const points = (data ?? []) as SeriesPoint[];
  if (points.length === 0) return undefined;

  const top = points.reduce((best, p) => ((p.y ?? 0) > (best.y ?? 0) ? p : best));
  if ((top.y ?? 0) <= 0) return undefined;

  const insights: string[] = [
    `Pico: ${String(top.x)} (${formatCompactNumberBR(top.y ?? 0)})`,
  ];

  if (points.length > 1) {
    const bottom = points.reduce((best, p) =>
      (p.y ?? 0) < (best.y ?? 0) ? p : best,
    );
    if ((bottom.y ?? 0) > 0 && bottom !== top) {
      insights.push(
        `Vale: ${String(bottom.x)} (${formatCompactNumberBR(bottom.y ?? 0)})`,
      );
    }
  }

  return insights;
}

export const definition = defineBlock<AreaProps, SeriesData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;