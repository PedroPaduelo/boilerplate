/**
 * Helpers de formatação numérica PT-BR — fonte única para os blocos do catálogo
 * (KPIs, gráficos, tabelas). Usa `Intl.NumberFormat('pt-BR')` para separador de
 * milhar (.) e decimal (,) corretos, além de notação compacta ("2,61 bi").
 *
 * Por que existe: valores financeiros da prefeitura chegam como bilhões/milhões.
 * Renderizar "2609946157.73" é ilegível; o esperado é "R$ 2,61 bi" (card) ou
 * "R$ 2.609.946.157,73" (tabela/detalhe).
 */

/** Coerção branda: aceita number | string numérica | null/undefined → number | null. */
export function toNumber(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return null;
}

/** Número PT-BR com separador de milhar e casas decimais controláveis. Ex.: 1234567.8 → "1.234.567,8". */
export function formatNumberBR(value: unknown, maxFractionDigits = 2): string {
  const n = toNumber(value);
  if (n == null) return '—';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  }).format(n);
}

/** Moeda BRL completa. Ex.: 2609946157.73 → "R$ 2.609.946.157,73". */
export function formatBRL(value: unknown): string {
  const n = toNumber(value);
  if (n == null) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(n);
}

/** Moeda BRL compacta. Ex.: 2609946157 → "R$ 2,61 bi"; 154902730 → "R$ 154,9 mi". */
export function formatCompactBRL(value: unknown): string {
  const n = toNumber(value);
  if (n == null) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 2,
  }).format(n);
}

/** Número compacto (sem moeda). Ex.: 2609946157 → "2,61 bi". */
export function formatCompactNumberBR(value: unknown): string {
  const n = toNumber(value);
  if (n == null) return '—';
  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 2,
  }).format(n);
}

/** Data PT-BR (dd/mm/aaaa) a partir de string/Date. Retorna null se inválida. */
export function formatDate(value: unknown): string | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/** Percentual a partir de uma FRAÇÃO (0.125 → "12,5%"). */
export function formatPercentBR(fraction: unknown, maxFractionDigits = 1): string {
  const n = toNumber(fraction);
  if (n == null) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  }).format(n);
}

/** Percentual a partir de um VALOR JÁ EM PONTOS (95 → "95%"). */
export function formatPercentPointsBR(points: unknown, maxFractionDigits = 1): string {
  const n = toNumber(points);
  if (n == null) return '—';
  return `${formatNumberBR(n, maxFractionDigits)}%`;
}

/**
 * Formata um valor de KPI escolhendo o melhor display:
 *  - unidade monetária (BRL/USD/EUR) → compacto na moeda ("R$ 2,61 bi");
 *  - sem unidade, magnitude alta (≥ 10 mil) → número compacto ("8,4 mil");
 *  - caso contrário → número PT-BR cheio ("95", "72,3").
 */
export function formatKpiValue(value: unknown, unit?: string): string {
  const n = toNumber(value);
  if (n == null) return '—';
  if (unit === 'BRL') return formatCompactBRL(n);
  if (unit === 'USD' || unit === 'EUR') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: unit,
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(n);
  }
  if (Math.abs(n) >= 10000) return formatCompactNumberBR(n);
  return formatNumberBR(n, 2);
}

/**
 * Catálogo de FORMATADORES DE VALOR para os blocos do catálogo (escolhidos via
 * `valueFormat` enum no schema). Cada string do enum casa 1:1 com um helper
 * PT-BR de `format.ts` — a UI base (`HBarChart`/`BarChart`/etc.) recebe uma
 * `valueFormatter: (v: number) => string`, montada no component.tsx a partir
 * deste enum. PT-BR via `Intl.NumberFormat`.
 *
 * Por que enum (não string livre):
 *  - autocomplete exato no editor de blocos do playground;
 *  - validação AJV na borda (em vez de quebrar em runtime);
 *  - coberto por testes de schema (`manifest.propsSchema.valueFormat.enum`).
 */
export const VALUE_FORMATS = [
  'BRL',
  'compactBRL',
  'number',
  'compactNumber',
  'percent',
] as const;

/** Tipo da prop `valueFormat` (union literal dos valores do enum). */
export type ValueFormat = (typeof VALUE_FORMATS)[number];

/**
 * Resolve um `valueFormat` (enum) no `valueFormatter` (função) usado pela UI
 * base. Aceita `unknown` (number | string numérica | null) e devolve SEMPRE
 * uma string formatada em PT-BR (sentinel `"—"` para entradas inválidas,
 * igual aos outros helpers deste módulo).
 *
 * Default interno: `'compactBRL'` (consistente com o padrão histórico dos
 * blocos do catálogo). Valores fora do enum caem no default (defensivo —
 * AJV já teria rejeitado, mas se a prop vier nula/indefinida/errada, não
 * quebramos o render).
 */
export function formatValueByEnum(
  value: unknown,
  format: ValueFormat | string | undefined | null,
): string {
  switch (format) {
    case 'BRL':
      return formatBRL(value);
    case 'compactBRL':
      return formatCompactBRL(value);
    case 'number':
      return formatNumberBR(value);
    case 'compactNumber':
      return formatCompactNumberBR(value);
    case 'percent':
      return formatPercentBR(value);
    default:
      return formatCompactBRL(value);
  }
}

/**
 * Formata uma duração em MILISSEGUNDOS em uma string PT-BR legível
 * (escala automática conforme a magnitude):
 *
 *  - `< 1_000`         → `"142ms"`        (1 unidade = 1ms)
 *  - `< 60_000`        → `"1.4s"`         (1 casa decimal)
 *  - `< 3_600_000`     → `"2min 15s"`     (minutos + segundos inteiros)
 *  - `≥ 3_600_000`     → `"1h 5min"`      (horas + minutos inteiros; sem segundos)
 *
 * Aceita `number` ou `string` numérica (coerção branda via `toNumber`).
 * `null` / `undefined` / `NaN` / `0` → `"—"` (sentinel de "sem duração"
 * presente em todo o DS — ex.: query não executada ainda).
 *
 * Por que existe: o `ChartWidget` precisa exibir a duração da query SQL no
 * rodapé técnico. Mostrar `durationMs` cru ("142") ou com sufixo hard-coded
 * ("142ms") é quebradiço p/ queries lentas (60_000ms = "60000ms" — feio).
 * A escala automática mantém a coluna curta em todas as magnitudes que
 * acontecem na vida real: do cache hit (5ms) ao ETL pesado (2h).
 */
export function formatDuration(ms: unknown): string {
  const n = toNumber(ms);
  if (n == null || n === 0) return '—';

  const MS_PER_SECOND = 1_000;
  const MS_PER_MINUTE = 60 * MS_PER_SECOND;
  const MS_PER_HOUR = 60 * MS_PER_MINUTE;

  if (n < MS_PER_SECOND) {
    // ex.: 142 → "142ms"
    return `${Math.round(n)}ms`;
  }
  if (n < MS_PER_MINUTE) {
    // ex.: 1400 → "1.4s" (1 casa). Locale PT-BR usa "," como decimal.
    return `${formatNumberBR(n / MS_PER_SECOND, 1)}s`;
  }
  if (n < MS_PER_HOUR) {
    // ex.: 135_000 → "2min 15s" (min + seg inteiros; sem casa decimal).
    const totalSeconds = Math.floor(n / MS_PER_SECOND);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}min ${seconds}s`;
  }
  // >= 1h: "1h 5min" (sem segundos — longa duração não precisa dessa precisão).
  const totalMinutes = Math.floor(n / MS_PER_MINUTE);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}min`;
}
