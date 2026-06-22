/**
 * Transformação RESULTADO → SHAPE do bloco (Camada 2 do doc 20).
 *
 * O pg-runner devolve `{ columns, rows }` cru. Cada bloco do catálogo declara um
 * `dataContract.shape` (scalar | series | categorical | table). Aqui mapeamos o
 * resultado para esse shape antes de validar contra o contrato.
 *
 * `transform` (do dataBinding) é, no MVP, OPCIONAL e DECLARATIVO: um objeto de
 * mapeamento de colunas. Sem ele, aplicamos a IDENTIDADE por convenção de nomes:
 *   - scalar:      coluna `value` (+ `label`/`unit`/`delta`/`format` se existirem)
 *   - series:      colunas `x`, `y` (+ `series`)
 *   - categorical: colunas `label`, `value`
 *   - table:       colunas do resultado viram `columns`; linhas viram `rows`
 *
 * Mapeamento declarativo (sobrescreve as convenções): `{ value, label, unit,
 * delta, format, x, y, series }` apontando para nomes de coluna do resultado.
 * `transform` que não seja objeto (ex.: string/ref nomeada) é tratado como
 * identidade no MVP (documentado — refs nomeadas ficam para evolução futura).
 *
 * Esta função NÃO valida — quem valida é `executeBlockData` (via
 * `validateBlockDataByShape`). Resultado fora do shape vira `block:error`.
 */
import type { QueryResultShape } from '@/lib/pg-runner';
import type { CatalogDataShape } from '@/lib/catalog';

type Row = Record<string, unknown>;
type ColumnMap = Record<string, unknown>;

function asColumnMap(transform: unknown): ColumnMap {
  return transform && typeof transform === 'object' && !Array.isArray(transform)
    ? (transform as ColumnMap)
    : {};
}

/** Nome de coluna mapeado (declarativo) com fallback para a convenção. */
function col(map: ColumnMap, key: string, fallback: string): string {
  const v = map[key];
  return typeof v === 'string' && v.length > 0 ? v : fallback;
}

/** Coerção branda para número | null (mantém objetos/strings inválidos para a validação reprovar). */
function toNumberOrNull(v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  // bigint vindo do pg para inteiros grandes → number.
  if (typeof v === 'bigint') return Number(v);
  return v; // tipo inesperado: deixa a validação do shape reprovar.
}

export function applyTransform(
  shape: CatalogDataShape,
  result: QueryResultShape,
  transform?: unknown,
): unknown {
  const map = asColumnMap(transform);
  const rows = result.rows as Row[];

  switch (shape) {
    case 'scalar': {
      const first = rows[0] ?? {};
      const valueKey = col(map, 'value', firstColumnName(result, 'value'));
      const out: Row = { value: toNumberOrNull(first[valueKey]) };
      const labelKey = col(map, 'label', 'label');
      const unitKey = col(map, 'unit', 'unit');
      const deltaKey = col(map, 'delta', 'delta');
      const formatKey = col(map, 'format', 'format');
      if (typeof first[labelKey] === 'string') out.label = first[labelKey];
      if (typeof first[unitKey] === 'string') out.unit = first[unitKey];
      if (first[deltaKey] !== undefined) out.delta = toNumberOrNull(first[deltaKey]);
      if (typeof first[formatKey] === 'string') out.format = first[formatKey];
      return out;
    }

    case 'series': {
      const xKey = col(map, 'x', 'x');
      const yKey = col(map, 'y', 'y');
      const seriesKey = col(map, 'series', 'series');
      return rows.map((r) => {
        const o: Row = { x: r[xKey], y: toNumberOrNull(r[yKey]) };
        if (r[seriesKey] !== undefined) o.series = r[seriesKey];
        return o;
      });
    }

    case 'categorical': {
      const labelKey = col(map, 'label', 'label');
      const valueKey = col(map, 'value', 'value');
      return rows.map((r) => ({ label: r[labelKey], value: toNumberOrNull(r[valueKey]) }));
    }

    case 'table': {
      const columns = result.columns.map((c) => ({ key: c.name, label: c.name }));
      return { columns, rows };
    }

    default:
      return null;
  }
}

/** Primeiro nome de coluna do resultado, ou um fallback se não houver colunas. */
function firstColumnName(result: QueryResultShape, fallback: string): string {
  return result.columns[0]?.name ?? fallback;
}
