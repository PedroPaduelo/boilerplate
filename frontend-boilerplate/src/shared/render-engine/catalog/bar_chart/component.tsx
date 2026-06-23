/**
 * Bloco `bar_chart` (shape 'series') — usa o Vitrine `BarChart` (vertical,
 * default) ou `HBarChart` (horizontal). Mapeia cada ponto {x,y,series?} da
 * série para o gráfico e expõe um `deriveTakeaway` (insights de rodapé).
 *
 * ===== COR (canônico — alinhado ao irmão `h_bar_chart`) =====
 *  - `accent` aceita enum DS (chart-1..5 | 'primary'), classe Tailwind
 *    (bg-purple-500) ou cor CSS crua (#40E0D0, rgb(), gradient). Resolvido
 *    por `resolveAccent()` em `lib/accent.ts` → `{ className }` (Tailwind) ou
 *    `{ style: { background } }` (CSS).
 *  - `palette`:
 *      · 'single' (default) → TODAS as barras/séries usam `accent`.
 *      · 'multi'            → cicla a paleta do DS (chart-1..5) por série/barra
 *                             via `paletteClass(i)`. `accent` custom é IGNORADO.
 *      · 'none'             → sem cor (default do UI base, bg-primary).
 *  - `seriesColors` (ENTREGA 3 — cor POR ITEM, configurável e NÃO automática):
 *    array de cores, UMA por série, na ordem (índice 0 = 1ª série). Cada cor
 *    passa por `resolveAccent()` (aceita enum/classe/CSS). Quando fornecida,
 *    SOBRESCREVE a palette automática para aquela série. Quando omitida, cai
 *    no comportamento automático (multi cicla, single usa accent). Pensada
 *    sobretudo para o modo empilhado (stacked), onde o usuário/IA via MCP quer
 *    fixar a cor de cada série empilhada manualmente.
 *
 * ===== STACKED (ENTREGA 1) =====
 *  - `stacked: true` + dados MULTI-SÉRIE (pontos com campo `series`) → as
 *    barras EMPILHAM: cada categoria do eixo X vira UMA coluna com segmentos
 *    empilhados, um por série. Implementado estendendo o `BarChart` (UI base)
 *    com a prop `stacks: BarChartStack[]`.
 *  - `stacked: false` → barras planas (comportamento atual: 1 barra por ponto).
 *  - Se não houver dados multi-série, `stacked` degrada graciosamente p/ plano.
 *  - LIMITAÇÃO: empilhamento só vale na orientação VERTICAL. Em
 *    `orientation: 'horizontal'` (que reaproveita o `HBarChart`, UI base fora
 *    do escopo editável), `stacked` é IGNORADO e as barras ficam planas —
 *    porém a COR por série é preservada (cada barra usa a cor da sua série).
 *
 * ===== valueFormat (ENTREGA 4 — paridade com h_bar_chart) =====
 *  - `valueFormat`: ENUM FECHADO (`BRL` | `compactBRL` | `number` |
 *    `compactNumber` | `percent`), default `'compactBRL'`. O component
 *    normaliza p/ a UI base via `formatValueByEnum()` de `format.ts`.
 *  - `valueFormatter` (prop opcional, override programático — não exposto no
 *    schema): se passado, vence o `valueFormat`. Mantido p/ retrocompat.
 */
import type { CSSProperties } from 'react';
import type { SeriesData } from '@dashboards/contracts';
import {
  BarChart,
  type BarChartDatum,
  type BarChartStack,
} from '@/components/ui/bar-chart';
import { HBarChart, type HBarChartDatum } from '@/components/ui/h-bar-chart';
import {
  formatCompactBRL,
  formatValueByEnum,
  type ValueFormat,
} from '@/shared/lib/format';
import { resolveAccent, paletteClass } from '../../lib/accent';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type BarProps = {
  /**
   * (ENTREGA 1) Empilha as séries. Requer dados multi-série (pontos com campo
   * `series`) E `orientation: 'vertical'`. `false` = barras planas.
   */
  stacked?: boolean;
  orientation?: 'vertical' | 'horizontal';
  /**
   * Cor base da barra. Aceita enum DS (chart-1..5, primary), classe Tailwind
   * (bg-purple-500) ou cor CSS (#40E0D0, rgb(), gradient). Em `palette:'multi'`
   * é IGNORADO (a paleta cíclica do DS vence). Resolvido por `resolveAccent()`.
   */
  accent?: string;
  palette?: 'single' | 'multi' | 'none';
  /**
   * (ENTREGA 3) Cor POR SÉRIE, na ordem (índice 0 = 1ª série). Cada cor aceita
   * enum DS / classe Tailwind / cor CSS. Sobrescreve a palette automática.
   * Se omitido, usa palette (multi cicla, single usa accent).
   */
  seriesColors?: string[];
  /**
   * (ENTREGA 4) Formato do valor exibido. ENUM FECHADO — default 'compactBRL'.
   * Normalizado p/ a UI base via `formatValueByEnum()`.
   */
  valueFormat?: ValueFormat;
  /**
   * Override programático do formatter (não exposto no schema). Se passado,
   * vence `valueFormat`. Mantido p/ retrocompat.
   */
  valueFormatter?: (value: number) => string;
};

/**
 * Tipo do ponto da série (no FE, `SeriesData` de @dashboards/contracts resolve
 * para `any` porque `json-schema-to-ts` não é dependência do FE — anotamos o
 * elemento localmente para manter o type-safety dentro do bloco).
 */
type SeriesPoint = { x: string | number; y: number | null; series?: string };

/** Partes de cor (classe Tailwind OU estilo inline) para uma barra/segmento. */
type ColorParts = { barClassName?: string; barStyle?: CSSProperties };

export const Component: BlockComponent<BarProps, SeriesData> = ({ props, data }) => {
  const points = (data ?? []) as SeriesPoint[];
  const palette = props.palette ?? 'single';
  const seriesColors = props.seriesColors;

  // (ENTREGA 4) valueFormat enum → formatador concreto. `valueFormatter`
  // (override programático) vence quando passado.
  const valueFormatter =
    props.valueFormatter ??
    ((v: number) => formatValueByEnum(v, props.valueFormat ?? 'compactBRL'));

  // `resolveAccent()` decide se a cor (accent global) é classe Tailwind ou
  // style inline (cor CSS crua).
  const resolvedAccent = resolveAccent(props.accent);
  const globalBarClassName: string =
    resolvedAccent.kind === 'class' ? resolvedAccent.className : 'bg-chart-1';
  const globalBarStyle: CSSProperties | undefined =
    resolvedAccent.kind === 'style' ? resolvedAccent.style : undefined;

  // Séries distintas, na ordem de aparição (índice canônico p/ cor por série).
  const orderedSeries: string[] = [];
  for (const p of points) {
    const s = p.series != null ? String(p.series) : null;
    if (s != null && !orderedSeries.includes(s)) orderedSeries.push(s);
  }
  const hasSeries = orderedSeries.length > 0;

  /**
   * Cor de um item pelo índice (de série ou de barra). Precedência:
   *   1) `seriesColors[idx]` (cor manual via prop — ENTREGA 3) →
   *      resolvida por `resolveAccent()`.
   *   2) `palette: 'multi'` → `paletteClass(idx)` (chart-1..5 cíclico).
   *   3) `palette: 'single'` → accent global (classe ou style).
   *   4) `palette: 'none'` → sem cor (UI base usa o default).
   */
  function colorForIndex(idx: number): ColorParts {
    const custom = seriesColors?.[idx];
    if (custom != null && custom !== '') {
      const r = resolveAccent(custom);
      return r.kind === 'class' ? { barClassName: r.className } : { barStyle: r.style };
    }
    if (palette === 'multi') return { barClassName: paletteClass(idx) };
    if (palette === 'single') {
      return globalBarStyle ? { barStyle: globalBarStyle } : { barClassName: globalBarClassName };
    }
    return {};
  }

  // ===================================================================== //
  //  STACKED (ENTREGA 1) — só na orientação VERTICAL e com multi-série.     //
  // ===================================================================== //
  const stackedMode =
    !!props.stacked && hasSeries && props.orientation !== 'horizontal';

  if (stackedMode) {
    // Agrupa por categoria (x), somando valores por série dentro da categoria.
    const categories: string[] = [];
    const byCat = new Map<string, Map<string, number>>();
    for (const p of points) {
      const cat = String(p.x);
      const ser = p.series != null ? String(p.series) : '—';
      if (!byCat.has(cat)) {
        categories.push(cat);
        byCat.set(cat, new Map());
      }
      const m = byCat.get(cat)!;
      m.set(ser, (m.get(ser) ?? 0) + (p.y ?? 0));
    }
    const stacks: BarChartStack[] = categories.map((cat) => {
      const m = byCat.get(cat)!;
      return {
        label: cat,
        segments: orderedSeries.map((ser, si) => {
          const c = colorForIndex(si);
          return {
            series: ser,
            value: m.get(ser) ?? 0,
            barClassName: c.barClassName,
            barStyle: c.barStyle,
          };
        }),
      };
    });
    return <BarChart series={[]} stacks={stacks} valueFormatter={valueFormatter} />;
  }

  // ===================================================================== //
  //  HORIZONTAL (plano) — reaproveita o HBarChart. Stacked é ignorado aqui. //
  // ===================================================================== //
  if (props.orientation === 'horizontal') {
    const series: HBarChartDatum[] = points.map((p, i) => {
      const colorIdx =
        hasSeries && p.series != null ? orderedSeries.indexOf(String(p.series)) : i;
      const c = colorForIndex(colorIdx);
      const datum: HBarChartDatum = { label: String(p.x), value: p.y ?? 0 };
      if (c.barClassName) datum.barClassName = c.barClassName;
      if (c.barStyle) datum.barStyle = c.barStyle;
      return datum;
    });
    return (
      <HBarChart series={series} accent="bg-chart-1" valueFormatter={valueFormatter} />
    );
  }

  // ===================================================================== //
  //  VERTICAL (plano) — default.                                           //
  // ===================================================================== //
  const series: BarChartDatum[] = points.map((p, i) => {
    const colorIdx =
      hasSeries && p.series != null ? orderedSeries.indexOf(String(p.series)) : i;
    const c = colorForIndex(colorIdx);
    const datum: BarChartDatum = { label: String(p.x), value: p.y ?? 0 };
    if (c.barClassName) datum.barClassName = c.barClassName;
    if (c.barStyle) datum.barStyle = c.barStyle;
    return datum;
  });
  return (
    <BarChart series={series} accent="bg-chart-1" valueFormatter={valueFormatter} />
  );
};

/**
 * Insights de rodapé (canônico — Turno 4): retorna 1 ou 2 frases curtas
 * (cada uma vira 1 linha com lâmpada no ChartWidget):
 *  - SEMPRE a 1ª: "Maior valor: {x} ({y em BRL compacto})".
 *  - OPCIONAL 2ª: "Menor valor: {x} ({y em BRL compacto})" — só se
 *    houver mais de 1 ponto E o menor valor for > 0.
 *
 * Retorno `string[]`; o BlockRenderer normaliza p/ o array
 * `{ enabled: true, text }[]` que o ChartWidget consome. PT-BR via
 * `formatCompactBRL` (consistência visual).
 */
function deriveTakeaway(data: SeriesData): string[] | undefined {
  const points = (data ?? []) as SeriesPoint[];
  if (points.length === 0) return undefined;

  const top = points.reduce((best, p) => ((p.y ?? 0) > (best.y ?? 0) ? p : best));
  if ((top.y ?? 0) <= 0) return undefined;

  const insights: string[] = [
    `Maior valor: ${String(top.x)} (${formatCompactBRL(top.y ?? 0)})`,
  ];

  if (points.length > 1) {
    const bottom = points.reduce((best, p) =>
      (p.y ?? 0) < (best.y ?? 0) ? p : best,
    );
    if ((bottom.y ?? 0) > 0 && bottom !== top) {
      insights.push(
        `Menor valor: ${String(bottom.x)} (${formatCompactBRL(bottom.y ?? 0)})`,
      );
    }
  }

  return insights;
}

export const definition = defineBlock<BarProps, SeriesData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;
