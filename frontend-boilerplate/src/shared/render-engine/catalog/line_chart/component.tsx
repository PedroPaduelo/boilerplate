/**
 * Bloco `line_chart` (shape 'series', x temporal) — usa o Vitrine `LineChart`.
 * Agrupa os pontos por `series` (multi-linha) preservando a ordem do eixo X.
 *
 * Prop de COR (Turno 5 — canônico): `accent` é enum fechado da paleta do DS
 * (validado pelo schema) MAS o input livre do playground aceita string custom.
 * `resolveAccentForStroke()` em `lib/accent.ts` traduz 1:1:
 *   - enum DS (chart-1..5 | 'primary') → classe Tailwind `stroke-chart-N`
 *     (regra CSS do tema resolve `var(--color-chart-1)`);
 *   - classe Tailwind (bg-purple-500) → deriva `stroke-purple-500`;
 *   - cor CSS crua (#40E0D0, rgb(), linear-gradient(), var(--chart-1))
 *     → `style.stroke` inline no polyline (atributo de apresentação SVG
 *     vence a classe CSS).
 * Modo de aplicação (ENTREGA 1 — espelha o `h_bar_chart`):
 *   - `palette: 'multi'` (default) → cada linha cicla `paletteStrokeClass(i)`
 *     (chart-1..5). O `accent` custom é IGNORADO neste modo (a paleta cíclica
 *     do DS vence); custom só vale em `single`.
 *   - `palette: 'single'` → TODAS as linhas com `accent` (1 cor — style se for
 *     cor CSS custom, className se for enum/classe DS).
 *   - `palette: 'none'` → sem distinção de cor (default `stroke-primary`).
 *
 * Prop `smooth` (ENTREGA 3): repassada ao UI base; `true` desenha curvas
 * suaves (Catmull-Rom via `<path>`), `false` mantém retas (`<polyline>`).
 *
 * Prop `valueFormatter` (opcional, novo Turno 5): permite trocar o formatador
 * do valor exibido no tooltip (default interno `formatBRL`). O bloco normaliza
 * para o caller trocar via prop — sem precisar editar o componente.
 *
 * `deriveTakeaway` (canônico — Turno 4): retorna 1-2 frases curtas
 * (cada uma vira 1 linha com lâmpada no ChartWidget):
 *  - SEMPRE a 1ª: "Pico: {x} ({y})" — ponto de maior valor.
 *  - OPCIONAL 2ª: "Vale: {x} ({y})" — só se houver +1 ponto e o menor > 0.
 */
import type { CSSProperties } from 'react';
import type { SeriesData } from '@dashboards/contracts';
import { LineChart, type LineSeries } from '@/components/ui/line-chart';
import { formatCompactNumberBR, formatBRL } from '@/shared/lib/format';
import {
  resolveAccentForStroke,
  paletteStrokeClass,
} from '../../lib/accent';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type LineProps = {
  smooth?: boolean;
  area?: boolean;
  palette?: 'single' | 'multi' | 'none';
  /**
   * Cor base da(s) série(s). Aceita:
   *  - enum DS: 'chart-1'..'chart-5' | 'primary' (validado pelo schema)
   *  - classe Tailwind: 'bg-purple-500' (custom)
   *  - cor CSS: '#40E0D0', 'rgb(0,255,0)', 'oklch(...)', 'linear-gradient(...)'
   *  - bare color: 'purple-500' (vira 'bg-purple-500' por conveniência)
   * Resolvido por `resolveAccentForStroke()` em `lib/accent.ts` — devolve
   * `{ className }` (Tailwind) ou `{ style: { stroke } }` (CSS).
   */
  accent?: string;
  /**
   * Formatter do valor exibido no tooltip (completo). Default: `formatBRL`
   * ("R$ 2.609.946,73"). O bloco normaliza para o caller trocar via prop
   * — sem precisar editar o componente.
   */
  valueFormatter?: (value: number) => string;
};

type SeriesPoint = { x: string | number; y: number | null; series?: string };

/** Converte SeriesData (lista de {x,y,series?}) em séries + rótulos do eixo X.
 *  NÃO aplica cor — a coloração (single/multi/none) é feita no Component,
 *  espelhando a lógica do `h_bar_chart`. */
export function toLineSeries(data: SeriesData): {
  series: LineSeries[];
  xLabels: string[];
} {
  const xOrder: string[] = [];
  const groups = new Map<string, Map<string, number>>();
  for (const point of data) {
    const seriesName = point.series ?? 'Série';
    const x = String(point.x);
    if (!xOrder.includes(x)) xOrder.push(x);
    if (!groups.has(seriesName)) groups.set(seriesName, new Map());
    groups.get(seriesName)!.set(x, point.y ?? 0);
  }
  const series: LineSeries[] = [...groups.entries()].map(([label, byX]) => ({
    label,
    data: xOrder.map((x) => byX.get(x) ?? 0),
  }));
  return { series, xLabels: xOrder };
}

export const Component: BlockComponent<LineProps, SeriesData> = ({ props, data }) => {
  // `resolveAccentForStroke()` devolve { className } (Tailwind stroke-…) ou
  // { style: { stroke } } (CSS). VENCE a classe `className` da série quando
  // `style` está presente (atributos de apresentação SVG).
  const resolvedAccent = resolveAccentForStroke(props.accent);
  const accentClassName: string | undefined =
    resolvedAccent.kind === 'class' ? resolvedAccent.className : undefined;
  const accentStyle: CSSProperties | undefined =
    resolvedAccent.kind === 'style' ? resolvedAccent.style : undefined;

  // valueFormatter flexível: usa a prop se passada, senão default BRL.
  const valueFormatter = props.valueFormatter ?? formatBRL;

  // Modo de aplicação do accent (ENTREGA 1 — espelha o `h_bar_chart`):
  //  - palette='single' → TODAS as linhas com o accent (style se cor CSS
  //    custom, className se enum/classe DS). 1 cor só.
  //  - palette='multi' (default) → cada linha cicla `paletteStrokeClass(i)`
  //    (chart-1..5); o accent custom é IGNORADO (a paleta cíclica vence).
  //    Antes, o accent custom quebrava o ciclo (só a 1ª linha colorida).
  //  - palette='none' → sem distinção de cor (deixa o default
  //    `stroke-primary` do UI base — nenhuma className/style por série).
  const palette = props.palette ?? 'multi';

  const { series, xLabels } = toLineSeries(data ?? []);

  const finalSeries: LineSeries[] = series.map((s, i) => {
    if (palette === 'multi') {
      return { ...s, className: paletteStrokeClass(i), style: undefined };
    }
    if (palette === 'single') {
      return accentStyle
        ? { ...s, style: accentStyle, className: undefined }
        : { ...s, className: accentClassName, style: undefined };
    }
    // palette === 'none'
    return { ...s, className: undefined, style: undefined };
  });

  return (
    <LineChart
      series={finalSeries}
      xLabels={xLabels}
      smooth={props.smooth === true}
      showArea={props.area !== false}
      yValueFormatter={(v) => formatCompactNumberBR(v)}
      valueFormatter={valueFormatter}
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
 * `formatCompactBRL` (mesmo formatter dos outros blocos).
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

export const definition = defineBlock<LineProps, SeriesData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;