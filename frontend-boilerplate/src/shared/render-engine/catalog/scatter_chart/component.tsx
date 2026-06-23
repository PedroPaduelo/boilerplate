/**
 * Bloco `scatter_chart` (shape 'series', x/y numéricos) — usa o Vitrine
 * `ScatterChartTremor`. Cada ponto {x,y,series?} vira {x,y,category}.
 *
 * Prop de COR (Turno 5 — canônico): `accent` aceita enum DS + string custom
 * (resolvido por `resolveAccent()` em `lib/accent.ts`):
 *   - enum DS (chart-1..5 | 'primary') → classe Tailwind `fill-chart-N`/
 *     `stroke-chart-N` (recharts espalha nos pontos);
 *   - classe Tailwind (bg-purple-500) → derivamos `fill-purple-500`/
 *     `stroke-purple-500` e aplicamos como classes;
 *   - cor CSS crua (#40E0D0, rgb(), gradient) → `style` inline (atributo
 *     de apresentação que vence a classe CSS no SVG).
 * Modo de aplicação:
 *   - `palette: 'multi'` (default) → cicla CHART_PALETTE por categoria;
 *     `accent` vira fallback (1 categoria só OU single-mode).
 *   - `palette: 'single'` → TODAS as categorias com `accent` (1 cor).
 *   - `palette: 'none'` → sem distinção (deixa a palette cíclica padrão).
 *
 * `deriveTakeaway` (canônico — Turno 4): retorna 1-2 frases curtas:
 *  - SEMPRE a 1ª: "{count} pontos em {n} séries" — total de observações.
 *  - OPCIONAL 2ª: "Maior correlação: ({x}, {y})" — top ponto por y.
 */
import type { CSSProperties } from 'react';
import type { SeriesData } from '@dashboards/contracts';
import {
  ScatterChartTremor,
  type ScatterChartTremorDatum,
} from '@/components/ui/scatter-chart-tremor';
import { formatNumberBR, formatCompactNumberBR } from '@/shared/lib/format';
import { resolveAccent } from '../../lib/accent';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type ScatterProps = {
  showLegend?: boolean;
  showGridLines?: boolean;
  palette?: 'single' | 'multi' | 'none';
  /**
   * Cor ÚNICA aplicada a TODAS as categorias (vence palette cíclica).
   * Aceita enum DS (validado pelo schema), classe Tailwind, cor CSS.
   * Resolvido por `resolveAccent()` em `lib/accent.ts`.
   */
  accent?: string;
};

type SeriesPoint = { x: string | number; y: number | null; series?: string };

export const Component: BlockComponent<ScatterProps, SeriesData> = ({ props, data }) => {
  const points = (data ?? []) as SeriesPoint[];
  const rows: ScatterChartTremorDatum[] = points.map((p) => ({
    x: Number(p.x),
    y: p.y ?? 0,
    category: p.series ?? 'Série',
  }));

  // `resolveAccent()` devolve { className } (Tailwind `bg-…`) ou
  // { style: { background } } (CSS). O UI base deriva fill/stroke/bg
  // do bare (`bg-chart-1` → `fill-chart-1 stroke-chart-1 bg-chart-1`).
  const resolvedAccent = resolveAccent(props.accent);
  const palette = props.palette ?? 'multi';
  const isSingle = palette === 'single';

  // Modo single: passa `accent` (classe) E `style` (CSS custom) globais.
  // O UI base decide: se `style` setado, ele vence a classe.
  // Modo multi/none: nenhum accent global (categoria cicla palette).
  const accentClass: string | undefined =
    isSingle && resolvedAccent.kind === 'class'
      ? resolvedAccent.className
      : undefined;
  const accentStyle: CSSProperties | undefined =
    isSingle && resolvedAccent.kind === 'style'
      ? resolvedAccent.style
      : undefined;

  return (
    <ScatterChartTremor
      data={rows}
      x="x"
      y="y"
      category="category"
      showLegend={props.showLegend !== false}
      showGridLines={props.showGridLines !== false}
      valueFormatter={(v) => formatNumberBR(v)}
      axisValueFormatter={(v) => formatCompactNumberBR(v)}
      height="h-64"
      accent={accentClass}
      style={accentStyle}
    />
  );
};

/**
 * Insights de rodapé (canônico — Turno 4): retorna 1 ou 2 frases curtas:
 *  - SEMPRE a 1ª: "{count} pontos em {n} séries" — total de observações
 *    e nº de categorias.
 *  - OPCIONAL 2ª: "Maior correlação: ({x}, {y})" — ponto de maior `y`
 *    (top da nuvem, se houver).
 * Retorno `string[]`; o BlockRenderer normaliza p/ o array
 * `{ enabled: true, text }[]` que o ChartWidget consome. PT-BR via
 * `formatNumberBR` para os valores.
 */
function deriveTakeaway(data: SeriesData): string[] | undefined {
  const points = (data ?? []) as SeriesPoint[];
  if (points.length === 0) return undefined;

  const categories = new Set(points.map((p) => p.series ?? 'Série'));
  const insights: string[] = [
    `${points.length} pontos em ${categories.size} ${categories.size === 1 ? 'série' : 'séries'}`,
  ];

  if (points.length > 0) {
    const top = points.reduce((best, p) =>
      (p.y ?? 0) > (best.y ?? 0) ? p : best,
    );
    if ((top.y ?? 0) > 0) {
      insights.push(
        `Maior correlação: (${formatNumberBR(Number(top.x))}, ${formatNumberBR(top.y ?? 0)})`,
      );
    }
  }

  return insights;
}

export const definition = defineBlock<ScatterProps, SeriesData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;