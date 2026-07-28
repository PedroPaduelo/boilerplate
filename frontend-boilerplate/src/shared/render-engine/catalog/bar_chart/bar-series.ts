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

/** Separador entre categoria e série no rótulo da barra horizontal. */
const LABEL_SEPARATOR = ' · ';

/** Uma barra do modo horizontal: o ponto + a série de onde ele veio. */
export interface BarPointWithSeries extends ChartPoint {
  /** Índice da série na ordem de aparição — é ele que escolhe a cor. */
  seriesIndex: number;
}

export interface BarPointsResult {
  /** Uma barra por par (categoria × série), na ordem do dado. */
  points: BarPointWithSeries[];
  /** `true` quando o dado nomeia séries. */
  hasNamedSeries: boolean;
}

/**
 * Converte a lista longa em pontos categóricos — o formato do gráfico de
 * barras horizontais, que não empilha (uma barra por linha do dado).
 *
 * ---------------------------------------------------------------------------
 * POR QUE O RÓTULO GANHA A SÉRIE
 * ---------------------------------------------------------------------------
 * A versão anterior fazia `points.map((p) => ({ label: String(p.x) }))`,
 * ignorando o campo `series`. Com dado multi-série — que é o que o próprio
 * `dataContract.example` do bloco anuncia — o eixo saía com a categoria
 * REPETIDA ("Jan", "Jan", "Fev", "Fev"…) e duas barras indistinguíveis; e a
 * cor, que era escolhida pelo índice da LINHA, mudava de série a cada mês.
 *
 * Agora cada barra é o par categoria × série, com rótulo composto quando há
 * série nomeada. Repetições do mesmo par são SOMADAS, como no modo vertical —
 * é o que faz os dois modos fecharem com o mesmo total.
 */
export function toBarPoints(data: SeriesData): BarPointsResult {
  const rows = (data ?? []) as BarPoint[];
  const hasNamedSeries = rows.some((point) => point.series != null);
  const seriesOrder: string[] = [];
  const byKey = new Map<string, BarPointWithSeries>();

  for (const point of rows) {
    const name = point.series != null ? String(point.series) : DEFAULT_SERIES_LABEL;
    if (!seriesOrder.includes(name)) seriesOrder.push(name);
    const category = String(point.x);
    const key = `${category}\u0000${name}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.value += point.y ?? 0;
      continue;
    }
    byKey.set(key, {
      label: hasNamedSeries ? `${category}${LABEL_SEPARATOR}${name}` : category,
      value: point.y ?? 0,
      seriesIndex: seriesOrder.indexOf(name),
    });
  }

  return { points: [...byKey.values()], hasNamedSeries };
}
