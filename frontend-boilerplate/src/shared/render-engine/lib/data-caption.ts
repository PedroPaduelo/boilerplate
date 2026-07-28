/**
 * RECORTE do dado — a linha que diz sobre o que o gráfico está falando.
 *
 * "Gráfico sem legenda de recorte é um número sem contexto" (doc
 * `composicao-da-resposta` §6): um card que mostra só "Mensagens por dia" não
 * responde de quando, de quantos, em que unidade. O título nomeia a medida; o
 * recorte a delimita.
 *
 * REGRA DE HONESTIDADE, que é o que torna este módulo útil: só se afirma o que
 * o payload prova. Período sai do próprio eixo temporal do dado; contagem de
 * categorias, do dado; unidade, do `valueFormat` declarado. Nada é inferido do
 * SQL nem do título — inventar "últimos 90 dias" porque a consulta *parece*
 * recente seria trocar um card sem contexto por um card com contexto errado, e
 * o segundo é pior: ninguém desconfia de uma legenda.
 *
 * Por isso toda parte é opcional e a função devolve `undefined` quando não há
 * nada verdadeiro a dizer — o card simplesmente não mostra a linha.
 */
import type { BlockDataResult } from '@dashboards/contracts';
import { formatNumberBR } from '@/shared/lib/format';
import { describeValueFormat } from './value-format';

/** Separador de partes — o mesmo "·" que a trilha usa ("4 passos · 12,3 s"). */
const SEPARATOR = ' · ';

export interface DataScopeInput {
  /** Resultado de dados do bloco (traz `data`, `shape` e `meta`). */
  result?: BlockDataResult;
  /** Props já mescladas do bloco — de onde sai a unidade (`valueFormat`). */
  props?: Record<string, unknown>;
}

/**
 * Monta a legenda de recorte do bloco. Devolve `undefined` quando o payload
 * não sustenta nenhuma afirmação.
 */
export function describeDataScope({ result, props }: DataScopeInput): string | undefined {
  if (!result || result.state !== 'success') return undefined;

  const data = (result as { data?: unknown }).data;
  const meta = (result as { meta?: DataMeta }).meta;

  const parts = [
    describePeriod(data),
    describeSeriesCount(data),
    describeVolume(data, meta),
    describeValueFormat(props?.valueFormat),
    // Truncado ANTES de cache: "isto não é o total" muda a leitura do número;
    // "isto pode estar velho" muda apenas a confiança nele.
    meta?.truncated === true ? 'amostra truncada' : undefined,
    meta?.cached === true ? 'do cache' : undefined,
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(SEPARATOR) : undefined;
}

interface DataMeta {
  rowCount?: number;
  truncated?: boolean;
  cached?: boolean;
}

type SeriesPoint = { x?: unknown; y?: unknown; series?: unknown };

/**
 * Período coberto pelo eixo X, quando ele é temporal ("18/07 a 28/07").
 *
 * Só declara período se TODOS os rótulos forem datas reconhecíveis: um eixo
 * meio data, meio categoria não tem período, tem bagunça — e anunciar o
 * intervalo dos que por acaso pareciam data seria mentir sobre o resto.
 */
function describePeriod(data: unknown): string | undefined {
  if (!Array.isArray(data) || data.length === 0) return undefined;

  const dates: TemporalLabel[] = [];
  for (const point of data as SeriesPoint[]) {
    const raw = point?.x;
    if (typeof raw !== 'string' && typeof raw !== 'number') return undefined;
    const parsed = readTemporal(String(raw));
    if (!parsed) return undefined;
    dates.push(parsed);
  }

  // A consulta é quem ordena, e ela pode vir decrescente — por isso min/max em
  // vez de primeiro/último.
  let first = dates[0];
  let last = dates[0];
  for (const date of dates) {
    if (date.sortKey < first.sortKey) first = date;
    if (date.sortKey > last.sortKey) last = date;
  }

  if (first.label === last.label) return first.label;
  return `${first.label} a ${last.label}`;
}

interface TemporalLabel {
  /** Chave comparável (lexicográfica) para achar o menor e o maior. */
  sortKey: string;
  /** Rótulo curto exibido no recorte. */
  label: string;
}

/**
 * Lê um rótulo de eixo como data, sem passar por `new Date()`.
 *
 * `new Date('2026-07-18')` é meia-noite UTC; formatado em pt-BR (UTC-3) vira
 * 17/07. Um recorte que erra o dia por fuso horário é exatamente o tipo de
 * imprecisão silenciosa que este módulo existe para evitar — então a leitura é
 * textual, por padrão reconhecido.
 */
function readTemporal(raw: string): TemporalLabel | null {
  const value = raw.trim();

  // 2026-07-18 (ISO) → 18/07
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/.exec(value);
  if (iso) {
    const [, year, month, day] = iso;
    return { sortKey: `${year}${month}${day}`, label: `${day}/${month}` };
  }

  // 2026-07 (mês ISO) → 07/2026
  const isoMonth = /^(\d{4})-(\d{2})$/.exec(value);
  if (isoMonth) {
    const [, year, month] = isoMonth;
    return { sortKey: `${year}${month}00`, label: `${month}/${year}` };
  }

  // 18/07/2026 → 18/07
  const brDate = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (brDate) {
    const [, day, month, year] = brDate;
    return { sortKey: `${year}${month}${day}`, label: `${day}/${month}` };
  }

  // 18/07 (sem ano — o agente já formatou no SQL) → ordena por mês/dia.
  const brShort = /^(\d{2})\/(\d{2})$/.exec(value);
  if (brShort) {
    const [, day, month] = brShort;
    return { sortKey: `${month}${day}`, label: `${day}/${month}` };
  }

  return null;
}

/** "2 séries" — só quando há mais de uma; uma série não é uma comparação. */
function describeSeriesCount(data: unknown): string | undefined {
  if (!Array.isArray(data)) return undefined;

  const names = new Set<string>();
  for (const point of data as SeriesPoint[]) {
    if (typeof point?.series === 'string' && point.series.trim() !== '') {
      names.add(point.series);
    }
  }
  return names.size > 1 ? `${names.size} séries` : undefined;
}

/**
 * Volume do que está desenhado: categorias (comparação), pontos (série) ou
 * linhas (tabela). É o que responde "isto é o todo ou um pedaço?".
 *
 * Séries TEMPORAIS não entram: o período já delimitou o recorte, e "11 pontos"
 * ao lado de "18/07 a 28/07" repete a mesma informação com outra roupa.
 */
function describeVolume(data: unknown, meta: DataMeta | undefined): string | undefined {
  if (Array.isArray(data)) {
    const points = data as SeriesPoint[];
    if (points.length === 0) return undefined;

    // Categórico (`{label, value}`): cada item é uma categoria.
    const isCategorical = points.every(
      (point) => typeof (point as { label?: unknown })?.label === 'string',
    );
    if (isCategorical) return plural(points.length, 'categoria', 'categorias');

    // Série: conta valores DISTINTOS de x — com multi-série o mesmo dia
    // aparece uma vez por série, e "20 pontos" para 10 dias × 2 séries seria
    // contar o dado, não o recorte.
    const axis = new Set<string>();
    for (const point of points) {
      if (point?.x != null) axis.add(String(point.x));
    }
    if (axis.size === 0) return undefined;
    if (describePeriod(data)) return undefined;
    return plural(axis.size, 'categoria', 'categorias');
  }

  // Tabela: `{columns, rows}`.
  const rows = (data as { rows?: unknown } | undefined)?.rows;
  if (Array.isArray(rows)) return plural(rows.length, 'linha', 'linhas');

  // Escalar não tem volume: é UM número, e dizer "1 linha" só ocupa espaço.
  if (data != null && typeof data === 'object' && 'value' in data) return undefined;

  return meta?.rowCount != null && meta.rowCount > 1
    ? plural(meta.rowCount, 'linha', 'linhas')
    : undefined;
}

/** Plural PT-BR com o número já formatado (milhar com ponto). */
function plural(count: number, singular: string, many: string): string {
  return `${formatNumberBR(count, 0)} ${count === 1 ? singular : many}`;
}
