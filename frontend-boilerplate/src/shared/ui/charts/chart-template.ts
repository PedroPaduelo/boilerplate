/**
 * INTERPOLAÇÃO DE VARIÁVEIS — `{{variavel}}` resolvida a partir dos DADOS do
 * bloco. Funções PURAS (sem React, sem DOM), compartilhadas por TODO campo de
 * texto do catálogo: título, subtítulo, descrição, rótulos, tooltip, rodapé,
 * takeaways e estado vazio.
 *
 * Implementado UMA vez, aqui, porque a alternativa é cada bloco inventar a sua
 * sintaxe — e aí `{{total}}` significa coisas diferentes em dois cards do mesmo
 * painel.
 *
 * ---------------------------------------------------------------------------
 * VOCABULÁRIO
 * ---------------------------------------------------------------------------
 * O escopo é derivado do dado JÁ resolvido no shape do bloco, então as mesmas
 * variáveis existem em todos os tipos:
 *
 *   {{total}}      soma dos valores          {{soma}}
 *   {{maximo}}     maior valor               {{max}}
 *   {{minimo}}     menor valor               {{min}}
 *   {{media}}      média                     {{avg}}
 *   {{contagem}}   nº de pontos/linhas       {{count}}
 *   {{primeiro}}   primeiro valor            {{first}}
 *   {{ultimo}}     último valor              {{last}}
 *   {{rotuloMaximo}} categoria do maior      {{maxLabel}}
 *   {{rotuloMinimo}} categoria do menor      {{minLabel}}
 *   {{valor}}      valor do escalar          {{value}}
 *   {{unidade}}    unidade do escalar        {{unit}}
 *   {{series}}     nomes das séries, separados por vírgula
 *
 * Caminhos também funcionam: `{{dados.0.y}}`, `{{linhas.2.municipio}}`.
 *
 * FORMATO: um pipe opcional escolhe o formatador PT-BR do sistema —
 * `{{total|compactBRL}}`, `{{media|percent}}`, `{{contagem|number}}`.
 */
import { formatValueByEnum, formatNumberBR, type ValueFormat } from '@/shared/lib/format';

/** Escopo de variáveis disponível para interpolação. */
export type ChartScope = Record<string, unknown>;

/** Casa `{{ caminho }}` e `{{ caminho | formato }}`. */
const TOKEN_PATTERN = /\{\{\s*([\w$.[\]-]+)\s*(?:\|\s*([\w]+)\s*)?\}\}/g;

/** Resultado da interpolação: texto final + variáveis que não existiam. */
export interface InterpolationResult {
  text: string;
  missing: string[];
}

/* ========================================================================== *
 * Derivação do escopo a partir dos dados
 * ========================================================================== */

/** Lê um número de um campo desconhecido; `null` quando não é numérico. */
function num(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return null;
}

/** Extrai `{ label, value }` de um ponto de qualquer um dos shapes. */
function readPoint(row: unknown): { label: string; value: number } | null {
  if (row == null || typeof row !== 'object') return null;
  const record = row as Record<string, unknown>;
  const value = num(record.value) ?? num(record.y) ?? num(record.count) ?? null;
  if (value == null) return null;
  const rawLabel = record.label ?? record.x ?? record.name ?? record.category;
  return { label: rawLabel == null ? '' : String(rawLabel), value };
}

/** Estatísticas de uma lista de pontos — a base do vocabulário comum. */
function statsOf(rows: unknown[]): ChartScope {
  const points = rows
    .map(readPoint)
    .filter((p): p is { label: string; value: number } => p !== null);
  if (points.length === 0) return { contagem: rows.length, count: rows.length };

  const values = points.map((p) => p.value);
  const total = values.reduce((sum, v) => sum + v, 0);
  const top = points.reduce((best, p) => (p.value > best.value ? p : best));
  const bottom = points.reduce((best, p) => (p.value < best.value ? p : best));

  return {
    total,
    soma: total,
    maximo: top.value,
    max: top.value,
    minimo: bottom.value,
    min: bottom.value,
    media: total / values.length,
    avg: total / values.length,
    contagem: points.length,
    count: points.length,
    primeiro: values[0],
    first: values[0],
    ultimo: values[values.length - 1],
    last: values[values.length - 1],
    rotuloMaximo: top.label,
    maxLabel: top.label,
    rotuloMinimo: bottom.label,
    minLabel: bottom.label,
  };
}

/** Nomes de série presentes num dado de shape `series`. */
function seriesNames(rows: unknown[]): string[] {
  const names = new Set<string>();
  for (const row of rows) {
    if (row && typeof row === 'object') {
      const name = (row as Record<string, unknown>).series;
      if (typeof name === 'string' && name.trim() !== '') names.add(name);
    }
  }
  return [...names];
}

/**
 * Monta o escopo de interpolação a partir dos dados do bloco.
 *
 * `extra` entra POR ÚLTIMO e vence: é por onde o bloco publica o que só ele
 * sabe (o valor já formatado de um KPI, o nome do período selecionado).
 */
export function buildChartScope(data: unknown, extra?: ChartScope): ChartScope {
  const scope: ChartScope = {};

  if (Array.isArray(data)) {
    Object.assign(scope, statsOf(data));
    scope.dados = data;
    scope.linhas = data;
    const names = seriesNames(data);
    if (names.length > 0) {
      scope.series = names.join(', ');
      scope.nomesSeries = names;
    }
  } else if (data != null && typeof data === 'object') {
    // Shape `scalar` ({ value, unit, delta… }) ou `table` ({ columns, rows }).
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.rows)) {
      Object.assign(scope, statsOf(record.rows));
      scope.linhas = record.rows;
      scope.colunas = record.columns;
      scope.contagem = record.rows.length;
      scope.count = record.rows.length;
    }
    Object.assign(scope, record);
    const value = num(record.value);
    if (value != null) {
      scope.valor = value;
      scope.value = value;
      if (scope.total == null) scope.total = value;
    }
    if (record.unit != null) scope.unidade = record.unit;
  }

  return extra ? { ...scope, ...extra } : scope;
}

/* ========================================================================== *
 * Resolução de caminho + interpolação
 * ========================================================================== */

/** Lê `a.b.0.c` num objeto/array. `undefined` quando o caminho não existe. */
export function readPath(scope: ChartScope, path: string): unknown {
  const parts = path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean);
  let current: unknown = scope;
  for (const part of parts) {
    if (current == null) return undefined;
    if (Array.isArray(current)) {
      const index = Number(part);
      if (!Number.isInteger(index)) return undefined;
      current = current[index];
      continue;
    }
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * A partir de onde um número sem pipe ganha separador de milhar.
 *
 * Abaixo disso ele sai cru, de propósito: `{{ano}}` de 2026 formatado viraria
 * "2.026" — e ano, código e identificador são os números pequenos que mais
 * aparecem num rótulo. Acima, separador é o que torna o valor legível
 * ("2.609.946.157"). Quem quiser outro formato pede no pipe.
 */
const THOUSANDS_THRESHOLD = 10_000;

/** Converte um valor resolvido em texto, aplicando o formato do pipe. */
function stringify(value: unknown, format?: string): string {
  if (value == null) return '';
  if (typeof value === 'number') {
    if (format) return formatValueByEnum(value, format as ValueFormat);
    return Number.isInteger(value) && Math.abs(value) < THOUSANDS_THRESHOLD
      ? String(value)
      : formatNumberBR(value);
  }
  if (typeof value === 'boolean') return value ? 'sim' : 'não';
  if (Array.isArray(value)) return value.map((item) => stringify(item)).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  const asNumber = num(value);
  return format && asNumber != null
    ? formatValueByEnum(asNumber, format as ValueFormat)
    : String(value);
}

/**
 * Substitui `{{variavel}}` pelos valores do escopo.
 *
 * Variável inexistente é PRESERVADA no texto (`{{foo}}`) e reportada em
 * `missing` — some em silêncio seria pior: quem está configurando o bloco
 * ficaria sem saber que digitou o campo errado.
 */
export function interpolate(
  text: string | undefined | null,
  scope: ChartScope,
): InterpolationResult {
  if (!text) return { text: '', missing: [] };

  const missing: string[] = [];
  const out = text.replace(TOKEN_PATTERN, (match, path: string, format?: string) => {
    const value = readPath(scope, path);
    if (value === undefined) {
      missing.push(path);
      return match;
    }
    return stringify(value, format);
  });

  return { text: out, missing };
}

/** Atalho: só o texto interpolado (o caso comum). */
export function interpolateText(
  text: string | undefined | null,
  scope: ChartScope,
): string {
  return interpolate(text, scope).text;
}

/** O texto contém alguma variável a interpolar? */
export function hasVariables(text: string | undefined | null): boolean {
  if (!text) return false;
  TOKEN_PATTERN.lastIndex = 0;
  return TOKEN_PATTERN.test(text);
}
