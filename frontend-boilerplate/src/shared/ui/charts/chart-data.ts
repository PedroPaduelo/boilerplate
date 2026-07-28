/**
 * COMPONENTE PRÓPRIO — adaptador entre a API pública dos gráficos
 * (`series: {label, data[]}`) e o formato tabular que o recharts consome
 * (`[{category, s0, s1, …}]`). Fica num arquivo só para que area/bar/line
 * compartilhem exatamente a mesma normalização (inclusive o modo percentual)
 * em vez de cada um recalcular a sua.
 */
import type { ChartPoint, ChartSeries } from './types';

/** Uma linha do dataset achatado consumido pelo recharts. */
export type ChartRow = Record<string, string | number>;

/** Chave do eixo de categorias nas linhas geradas. */
export const CATEGORY_KEY = 'category';

/** Chave estável da série `index` (rótulos podem repetir; índices não). */
export function seriesKey(index: number): string {
  return `s${index}`;
}

/** Índice da série a partir da chave gerada por `seriesKey` (`s3` → 3). */
export function seriesIndexFromKey(key: string): number {
  const index = Number(key.slice(1));
  return key.startsWith('s') && Number.isInteger(index) ? index : -1;
}

/** Nº de pontos do dataset = maior comprimento entre as séries. */
function pointCount(series: ChartSeries[]): number {
  return series.reduce((max, item) => Math.max(max, item.data.length), 0);
}

/** `true` quando não há nada para desenhar (sem série ou sem ponto). */
export function isSeriesEmpty(series: ChartSeries[]): boolean {
  return series.length === 0 || pointCount(series) === 0;
}

/** `true` quando não há ponto categórico com valor útil. */
export function isPointsEmpty(points: ChartPoint[]): boolean {
  return points.length === 0 || points.every((point) => !Number.isFinite(point.value));
}

/**
 * Achata as séries em linhas do recharts. `labels[i]` vira a categoria da
 * linha `i`; sem `labels`, usa a posição (1-based) como rótulo.
 */
export function toChartRows(series: ChartSeries[], labels?: string[]): ChartRow[] {
  const total = pointCount(series);
  return Array.from({ length: total }, (_, i) => {
    const row: ChartRow = { [CATEGORY_KEY]: labels?.[i] ?? String(i + 1) };
    series.forEach((item, index) => {
      row[seriesKey(index)] = item.data[i] ?? 0;
    });
    return row;
  });
}

/**
 * Normaliza cada linha para somar 100 (modo percentual das áreas/barras
 * empilhadas). Linhas com total zero ficam zeradas em vez de virar `NaN`.
 */
export function toPercentRows(rows: ChartRow[], seriesCount: number): ChartRow[] {
  return rows.map((row) => {
    const keys = Array.from({ length: seriesCount }, (_, i) => seriesKey(i));
    const total = keys.reduce((sum, key) => sum + Number(row[key] ?? 0), 0);
    const next: ChartRow = { ...row };
    keys.forEach((key) => {
      next[key] = total === 0 ? 0 : (Number(row[key] ?? 0) / total) * 100;
    });
    return next;
  });
}

/** Converte pontos categóricos em linhas do recharts. */
export function toPointRows(points: ChartPoint[]): ChartRow[] {
  return points.map((point) => ({
    [CATEGORY_KEY]: point.label,
    value: Number.isFinite(point.value) ? point.value : 0,
  }));
}

/** Formatador padrão: inteiro sem casas, fracionário com uma casa. */
export function formatChartValue(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/**
 * Resumo textual usado como equivalente acessível quando o chamador não passa
 * um `summary` melhor. Diz quantas séries, quantos pontos e o pico.
 */
export function describeSeries(
  series: ChartSeries[],
  format: (value: number) => string = formatChartValue,
): string {
  if (isSeriesEmpty(series)) return 'Sem dados.';
  const values = series.flatMap((item) => item.data).filter(Number.isFinite);
  const max = values.length > 0 ? Math.max(...values) : 0;
  const names = series.map((item) => item.label).join(', ');
  return `${series.length} série(s): ${names}. ${pointCount(series)} pontos. Maior valor: ${format(max)}.`;
}

/** Resumo textual equivalente para conjuntos de pontos categóricos. */
export function describePoints(
  points: ChartPoint[],
  format: (value: number) => string = formatChartValue,
): string {
  if (isPointsEmpty(points)) return 'Sem dados.';
  const parts = points.map((point) => `${point.label}: ${format(point.value)}`);
  return `${points.length} categorias. ${parts.join('; ')}.`;
}
