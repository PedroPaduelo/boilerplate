/**
 * Bloco `spark_chart` (shape 'series') — usa o Vitrine `SparkChartTremor`.
 * Reduz a série a um vetor de números (os `y`). Ampliado para a galeria.
 *
 * Prop de COR (ENTREGA 1 — a cor pinta o GRÁFICO, não o fundo): `accent`
 * aceita enum DS + string custom, resolvido por `resolveAccentForStroke()`
 * em `lib/accent.ts` (e NÃO `resolveAccent`, que devolveria `background` e
 * pintava o fundo do card — o bug que esta entrega corrige):
 *   - enum DS (chart-1..5 | 'primary') → classe `stroke-chart-N` (a UI base
 *     deriva `var(--chart-N)` aplicada via `currentColor` no traço/gradiente);
 *   - classe Tailwind (stroke-purple-500) → usada direto;
 *   - cor CSS crua (#40E0D0, rgb(), gradient) → `style.stroke` → a UI base
 *     aplica como cor da SÉRIE (stroke da linha/área, fill das barras),
 *     NUNCA como background do container.
 *
 * Modo de aplicação (ENTREGA 3 — `palette: 'multi'` IMPLEMENTADO):
 *   - `palette: 'single'` (default) → 1 cor (accent) na série.
 *   - `palette: 'multi'` → a UI base aplica um GRADIENTE multicolor (as 5
 *     cores do DS, chart-1..5) ao longo da série (stroke/fill). Como o spark
 *     é single-série, não há fatias para ciclar cores — então `multi` vira
 *     um visual arco-íris contínuo (decisão (a) da entrega). Nesse modo o
 *     `accent` de cor única é ignorado (a paleta multicolor vence).
 *   - `palette: 'none'` → comportamento single (1 cor accent).
 *
 * `deriveTakeaway` (canônico — Turno 4): retorna 1-2 frases curtas:
 *  - SEMPRE a 1ª: "Tendência: {up|down|flat}" (delta % entre primeiro e último).
 *  - OPCIONAL 2ª: "Range: {min}–{max}" (alcance absoluto).
 */
import type { CSSProperties } from 'react';
import type { SeriesData } from '@dashboards/contracts';
import { SparkChartTremor } from '@/components/ui/spark-chart-tremor';
import { resolveAccentForStroke } from '../../lib/accent';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type SparkProps = {
  type?: 'area' | 'bar' | 'line';
  curveType?: 'linear' | 'monotone' | 'step';
  /**
   * Modo de paleta (ENTREGA 3):
   *  - 'single' (default) → 1 cor (accent) na série.
   *  - 'multi' → GRADIENTE multicolor (chart-1..5) ao longo da série.
   *  - 'none' → comportamento single (1 cor accent).
   */
  palette?: 'single' | 'multi' | 'none';
  /**
   * Cor ÚNICA da série (usada em palette 'single'/'none'). Aceita enum DS
   * (validado pelo schema), classe Tailwind `stroke-…`, cor CSS. Resolvido
   * por `resolveAccentForStroke()` — pinta o TRAÇO/preenchimento da série,
   * nunca o fundo (ENTREGA 1).
   */
  accent?: string;
};

type SeriesPoint = { x: string | number; y: number | null; series?: string };

export const Component: BlockComponent<SparkProps, SeriesData> = ({ props, data }) => {
  const points = (data ?? []) as SeriesPoint[];
  const values = points.map((p) => p.y ?? 0);

  // ENTREGA 1 — a cor pinta o GRÁFICO, não o fundo: `resolveAccentForStroke()`
  // devolve { className: 'stroke-…' } (Tailwind) ou { style: { stroke } }
  // (CSS) — em vez do `resolveAccent()` antigo, que devolvia
  // { style: { background } } e pintava o fundo do card. O `SparkChartTremor`
  // aplica `accent`/`style` como cor da SÉRIE (stroke/fill).
  const resolvedAccent = resolveAccentForStroke(props.accent);
  const accentClass: string | undefined =
    resolvedAccent.kind === 'class' ? resolvedAccent.className : undefined;
  const accentStyle: CSSProperties | undefined =
    resolvedAccent.kind === 'style' ? resolvedAccent.style : undefined;

  // ENTREGA 3 — palette 'multi' → gradiente multicolor na série (a UI base
  // monta o gradiente com chart-1..5). 'single'/'none' usam a cor accent.
  const multicolor = (props.palette ?? 'single') === 'multi';

  return (
    <div className="flex justify-center py-4">
      <SparkChartTremor
        data={values}
        type={props.type ?? 'area'}
        curveType={props.curveType ?? 'monotone'}
        className="h-20 w-full"
        accent={accentClass}
        style={accentStyle}
        multicolor={multicolor}
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