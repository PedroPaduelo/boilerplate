/**
 * Bloco `spark_chart` (shape 'series') — usa o Vitrine `SparkChartTremor`.
 * Reduz a série a um vetor de números (os `y`). Ampliado para a galeria.
 *
 * Prop de COR (Turno 5 — canônico): `accent` aceita enum DS + string custom
 * (resolvido por `resolveAccent()` em `lib/accent.ts`):
 *   - enum DS (chart-1..5 | 'primary') → `var(--chart-N)` no gradiente
 *     (cor literal no `<linearGradient>` via `style={{ color }}` + classe
 *     Tailwind `stroke-chart-N` no `<line>`/`<bar>`);
 *   - classe Tailwind (bg-purple-500) → derivamos `purple-500` puro e
 *     aplicamos como CSS color;
 *   - cor CSS crua (#40E0D0, rgb(), gradient) → `style.color` inline no
 *     container (vence a classe CSS).
 *
 * Modo de aplicação (spark é SINGLE-SÉRIE por natureza — Turno 6):
 *   - `palette: 'single'` (default) → 1 cor (accent).
 *   - `palette: 'multi'` → IGNORADO. Spark é uma linha única (sem
 *     fatias/itens visíveis que justifiquem ciclar cores), então o
 *     componente sempre aplica `accent`. A prop fica no schema só
 *     para simetria com os outros gráficos do catálogo (não emite
 *     warn — comportamento é determinístico).
 *   - `palette: 'none'` → mesmo comportamento (ignorado).
 *
 * `deriveTakeaway` (canônico — Turno 4): retorna 1-2 frases curtas:
 *  - SEMPRE a 1ª: "Tendência: {up|down|flat}" (delta % entre primeiro e último).
 *  - OPCIONAL 2ª: "Range: {min}–{max}" (alcance absoluto).
 */
import type { CSSProperties } from 'react';
import type { SeriesData } from '@dashboards/contracts';
import { SparkChartTremor } from '@/components/ui/spark-chart-tremor';
import { resolveAccent } from '../../lib/accent';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type SparkProps = {
  type?: 'area' | 'bar' | 'line';
  curveType?: 'linear' | 'monotone' | 'step';
  /**
   * Modo de paleta (spark é single-série por natureza).
   *  - 'single' (default) → 1 cor (accent).
   *  - 'multi' → IGNORADO (spark não cicla).
   *  - 'none' → IGNORADO (mesmo comportamento).
   * Mantido no schema p/ simetria com os outros gráficos.
   */
  palette?: 'single' | 'multi' | 'none';
  /**
   * Cor ÚNICA da série (spark é single-série por natureza).
   * Aceita enum DS (validado pelo schema), classe Tailwind, cor CSS.
   * Resolvido por `resolveAccent()` em `lib/accent.ts`.
   */
  accent?: string;
};

type SeriesPoint = { x: string | number; y: number | null; series?: string };

export const Component: BlockComponent<SparkProps, SeriesData> = ({ props, data }) => {
  const points = (data ?? []) as SeriesPoint[];
  const values = points.map((p) => p.y ?? 0);

  // `resolveAccent()` devolve { className } (Tailwind `bg-…`) ou
  // { style: { background } } (CSS). O `SparkChartTremor` aceita `accent`
  // (classe Tailwind `bg-…`/`fill-…`/`stroke-…`) E `style` (CSS custom).
  // Passamos ambos: o UI base decide precedência (style vence accent).
  const resolvedAccent = resolveAccent(props.accent);
  const accentClass: string | undefined =
    resolvedAccent.kind === 'class' ? resolvedAccent.className : undefined;
  const accentStyle: CSSProperties | undefined =
    resolvedAccent.kind === 'style' ? resolvedAccent.style : undefined;

  // `palette` é aceito pelo schema mas é IGNORADO (spark é single-série).
  // Não emitimos warn — comportamento determinístico, documentado na JSDoc.

  return (
    <div className="flex justify-center py-4">
      <SparkChartTremor
        data={values}
        type={props.type ?? 'area'}
        curveType={props.curveType ?? 'monotone'}
        className="h-20 w-full"
        accent={accentClass}
        style={accentStyle}
      />
    </div>
  );
};

/**
 * Insights de rodapé (canônico — Turno 4): retorna 1 ou 2 frases curtas:
 *  - SEMPRE a 1ª: "Tendência: {up|down|flat} ({delta%})" — variação
 *    percentual do primeiro para o último valor (clamp em ±999%).
 *  - OPCIONAL 2ª: "Range: {min}–{max}" — alcance absoluto dos valores.
 * Retorno `string[]`; o BlockRenderer normaliza p/ o array
 * `{ enabled: true, text }[]` que o ChartWidget consome. PT-BR via
 * `formatCompactNumberBR` (mesmo formatter dos outros blocos).
 */
function deriveTakeaway(data: SeriesData): string[] | undefined {
  const points = (data ?? []) as SeriesPoint[];
  if (points.length === 0) return undefined;

  const values = points.map((p) => p.y ?? 0);
  const first = values[0];
  const last = values[values.length - 1];
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Tendência: compara primeiro e último.
  let trend: 'up' | 'down' | 'flat';
  let deltaPct: number;
  if (first === 0 && last === 0) {
    trend = 'flat';
    deltaPct = 0;
  } else if (first === 0) {
    // De zero a >0 — não calcula % (infinito); marca como 'up' sem %.
    trend = 'up';
    deltaPct = 0;
  } else {
    deltaPct = ((last - first) / Math.abs(first)) * 100;
    // Clamp para evitar "9999%" em outliers (display puro, sem analytics).
    deltaPct = Math.max(-999, Math.min(999, deltaPct));
    if (Math.abs(deltaPct) < 0.5) {
      trend = 'flat';
    } else {
      trend = deltaPct > 0 ? 'up' : 'down';
    }
  }

  const trendLabel =
    trend === 'flat'
      ? 'estável'
      : trend === 'up'
        ? 'alta'
        : 'queda';

  const insights: string[] = [];
  if (first === 0 && last !== 0) {
    insights.push(`Tendência: ${trendLabel} (de 0 para ${last})`);
  } else {
    insights.push(`Tendência: ${trendLabel} (${deltaPct > 0 ? '+' : ''}${deltaPct.toFixed(1)}%)`);
  }

  if (points.length > 1) {
    insights.push(`Range: ${min}–${max}`);
  }

  return insights;
}

export const definition = defineBlock<SparkProps, SeriesData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;