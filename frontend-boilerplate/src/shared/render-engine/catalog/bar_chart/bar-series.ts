/**
 * Adaptação de DADOS do bloco `bar_chart` — separada do componente porque é a
 * parte pura (e testável sem DOM) da história: o contrato entrega uma lista
 * longa de `{x, y, series?}` e os gráficos da base pedem séries alinhadas a um
 * eixo (vertical) ou pontos categóricos (horizontal).
 */
import type { SeriesData } from '@dashboards/contracts';
import type { ChartPoint, ChartSeries } from '@/shared/ui';

/** Um ponto do contrato 'series' (anotado aqui: no FE o tipo resolve p/ any). */
export interface BarPoint {
  x: string | number;
  y: number | null;
  series?: string;
}

/** Rótulo de série usado quando o dado não nomeia nenhuma. */
const DEFAULT_SERIES_LABEL = 'Valor';

export interface BarSeriesResult {
  /** Séries alinhadas ao eixo X, na ordem de aparição. */
  series: ChartSeries[];
  /** Categorias do eixo X, na ordem de aparição. */
  labels: string[];
  /** `true` quando o dado nomeia séries (habilita empilhamento). */
  hasNamedSeries: boolean;
}

/** Achata a lista longa em séries × categorias, preservando a ordem do dado. */
export function toBarSeries(data: SeriesData): BarSeriesResult {
  const points = (data ?? []) as BarPoint[];
  const labels: string[] = [];
  const groups = new Map<string, Map<string, number>>();
  let hasNamedSeries = false;

  for (const point of points) {
    const name = point.series != null ? String(point.series) : DEFAULT_SERIES_LABEL;
    if (point.series != null) hasNamedSeries = true;
    const label = String(point.x);
    if (!labels.includes(label)) labels.push(label);
    if (!groups.has(name)) groups.set(name, new Map());
    const bucket = groups.get(name)!;
    // Soma repetições da mesma categoria dentro da série — é o que faz o
    // empilhamento fechar com o total da consulta.
    bucket.set(label, (bucket.get(label) ?? 0) + (point.y ?? 0));
  }

  const series = [...groups.entries()].map(([label, byLabel]) => ({
    label,
    data: labels.map((category) => byLabel.get(category) ?? 0),
  }));

  return { series, labels, hasNamedSeries };
}

/**
 * Converte a lista longa em pontos categóricos — o formato do gráfico de
 * barras horizontais, que não empilha (uma barra por linha do dado).
 */
export function toBarPoints(data: SeriesData): ChartPoint[] {
  const points = (data ?? []) as BarPoint[];
  return points.map((point) => ({
    label: String(point.x),
    value: point.y ?? 0,
  }));
}
