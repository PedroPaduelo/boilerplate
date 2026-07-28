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
        const o: Row = { x: paraRotulo(r[xKey]), y: toNumberOrNull(r[yKey]) };
        if (r[seriesKey] !== undefined) o.series = paraRotulo(r[seriesKey]);
        return o;
      });
    }

    case 'categorical': {
      const labelKey = col(map, 'label', 'label');
      const valueKey = col(map, 'value', 'value');
      return rows.map((r) => ({
        label: paraRotulo(r[labelKey]),
        value: toNumberOrNull(r[valueKey]),
      }));
    }

    case 'table': {
      const columns = result.columns.map((c) => ({
        key: c.name,
        label: c.name,
        type: pgTypeToColumnType(c.dataTypeID),
      }));
      return { columns, rows };
    }

    default:
      return null;
  }
}

/**
 * Valor de EIXO/RÓTULO no formato que o contrato aceita (string ou número).
 *
 * O driver do Postgres devolve `timestamp`/`date` como `Date` do JavaScript, e
 * o contrato de `series`/`categorical` só admite string ou número. Resultado:
 * todo gráfico de evolução com `date_trunc('day', …)` no eixo x — que é como
 * se escreve uma série temporal — era recusado com `contract_violation:
 * /0/x must be string,number`, uma vez por linha. O agente então reescrevia a
 * consulta com `to_char(...)` para contornar. Ele estava certo no SQL; quem
 * devolvia um tipo que o próprio contrato não aceita éramos nós.
 *
 * Uma data à meia-noite vira `YYYY-MM-DD` (é um DIA, e é assim que ele deve
 * aparecer no eixo); com hora, mantém o ISO completo, que ordena
 * lexicograficamente igual à ordem cronológica.
 */
function paraRotulo(valor: unknown): unknown {
  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return null;
    const iso = valor.toISOString();
    return iso.endsWith('T00:00:00.000Z') ? iso.slice(0, 10) : iso;
  }
  // `bigint` não sobrevive a JSON.stringify; vira texto, que o contrato aceita.
  if (typeof valor === 'bigint') return valor.toString();
  return valor;
}

/** Primeiro nome de coluna do resultado, ou um fallback se não houver colunas. */
function firstColumnName(result: QueryResultShape, fallback: string): string {
  return result.columns[0]?.name ?? fallback;
}

/**
 * Mapeia o OID do tipo Postgres (pg_type) para o `type` do contrato de tabela
 * ('string' | 'number' | 'date' | 'boolean') — assim o FE formata cada célula
 * (números em PT-BR, datas, booleanos) sem precisar formatar no SQL.
 *
 * OIDs estáveis do catálogo do Postgres (não mudam entre versões).
 */
function pgTypeToColumnType(oid: number): 'string' | 'number' | 'date' | 'boolean' {
  switch (oid) {
    // inteiros / floats / numeric / money / oid
    case 20: // int8 (bigint)
    case 21: // int2 (smallint)
    case 23: // int4 (integer)
    case 26: // oid
    case 700: // float4
    case 701: // float8
    case 790: // money
    case 1700: // numeric
      return 'number';
    // datas / horários
    case 1082: // date
    case 1083: // time
    case 1114: // timestamp
    case 1184: // timestamptz
    case 1266: // timetz
      return 'date';
    // booleano
    case 16: // bool
      return 'boolean';
    default:
      return 'string';
  }
}
