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
