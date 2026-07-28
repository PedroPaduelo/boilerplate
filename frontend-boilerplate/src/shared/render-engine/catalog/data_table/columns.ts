/**
 * Colunas, formatação, ordenação e busca do bloco `data_table`.
 *
 * Vive separado do componente porque é a parte que TRADUZ o contrato de dados
 * (colunas tipadas vindas do backend) para o vocabulário da tabela do design
 * system — e o componente fica só com a composição.
 */
import { proportional } from '@astryxdesign/core/Table';
import type { TableColumn, TableSortComparator } from '@astryxdesign/core/Table';
import { formatNumberBR, formatDate as fmtDate, toNumber } from '@/shared/lib/format';

/** Coluna tipada do contrato de dados (shape 'table'). */
export type ColumnSpec = {
  key: string;
  label: string;
  type?: 'string' | 'number' | 'date' | 'boolean';
};

/** Linha crua do contrato de dados. */
export type Row = Record<string, unknown>;

/** Valor formatado por tipo (o mesmo formato que o bloco sempre exibiu). */
function formatCell(value: unknown, type?: ColumnSpec['type']): string {
  if (value == null) return '—';
  if (type === 'number') {
    // `numeric` do Postgres chega como string — coage antes de formatar.
    const n = toNumber(value);
    return n != null ? formatNumberBR(n, 2) : String(value);
  }
  if (type === 'boolean') return value ? 'Sim' : 'Não';
  if (type === 'date') return fmtDate(value) ?? String(value);
  return String(value);
}

/** Colunas do DS: largura proporcional, número à direita, todas ordenáveis. */
export function buildColumns(specs: ColumnSpec[]): TableColumn<Row>[] {
  return specs.map((spec) => ({
    key: spec.key,
    header: spec.label,
    width: proportional(1),
    align: spec.type === 'number' ? 'end' : 'start',
    sortable: true,
    renderCell: (item: Row) => formatCell(item[spec.key], spec.type),
  }));
}

/** Timestamp de uma data (inválida vai para o fim da ordenação). */
function timeOf(value: unknown): number {
  if (value == null) return Number.NEGATIVE_INFINITY;
  const d = value instanceof Date ? value : new Date(String(value));
  const t = d.getTime();
  return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t;
}

/**
 * Comparadores por tipo. Sem eles, a ordenação do DS cai no texto — o que
 * quebraria valores numéricos vindos como string e datas em formato ISO.
 */
export function buildComparators(
  specs: ColumnSpec[],
): Partial<Record<string, TableSortComparator<Row>>> {
  const comparators: Record<string, TableSortComparator<Row>> = {};
  for (const spec of specs) {
    if (spec.type === 'number') {
      comparators[spec.key] = (a, b) =>
        (toNumber(a[spec.key]) ?? Number.NEGATIVE_INFINITY) -
        (toNumber(b[spec.key]) ?? Number.NEGATIVE_INFINITY);
    } else if (spec.type === 'date') {
      comparators[spec.key] = (a, b) => timeOf(a[spec.key]) - timeOf(b[spec.key]);
    }
  }
  return comparators;
}

/**
 * Busca global: casa com o valor EXIBIDO de qualquer coluna, para o usuário
 * procurar pelo que está lendo na tela (ex.: "1.200,00", não "1200").
 */
export function filterRows(rows: Row[], specs: ColumnSpec[], query: string): Row[] {
  const term = query.trim().toLocaleLowerCase('pt-BR');
  if (term === '') return rows;
  return rows.filter((row) =>
    specs.some((spec) => {
      const raw = row[spec.key];
      const shown = formatCell(raw, spec.type).toLocaleLowerCase('pt-BR');
      const rawText = raw == null ? '' : String(raw).toLocaleLowerCase('pt-BR');
      return shown.includes(term) || rawText.includes(term);
    }),
  );
}
