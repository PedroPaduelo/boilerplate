/**
 * Colunas, formatação, ordenação e busca do bloco `data_table`.
 *
 * Vive separado do componente porque é a parte que TRADUZ o contrato de dados
 * (colunas tipadas vindas do backend) para o vocabulário da tabela do design
 * system — e o componente fica só com a composição.
 *
 * É `.tsx` porque a tradução inclui o DESENHO da célula: a célula de texto passa
 * pelo contrato comum (`ChartText`: Markdown inline + `{{variavel}}`) e a célula
 * numérica sai com algarismos tabulares. Formatar e desenhar andam juntos aqui —
 * o mesmo `formatCell` alimenta a busca (texto) e a célula (nó), então separá-los
 * em dois arquivos só criaria a chance de os dois divergirem.
 */
import { proportional } from '@astryxdesign/core/Table';
import type { TableColumn, TableSortComparator } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { ChartText, chartPlainText, hasVariables } from '@/shared/ui';
import type { ChartScope } from '@/shared/ui';
import { formatNumberBR, formatDate as fmtDate, toNumber } from '@/shared/lib/format';

/** Coluna tipada do contrato de dados (shape 'table'). */
export type ColumnSpec = {
  key: string;
  label: string;
  type?: 'string' | 'number' | 'date' | 'boolean';
};

/** Linha crua do contrato de dados. */
export type Row = Record<string, unknown>;

/** Célula sem valor — o mesmo travessão dos demais blocos tabulares. */
const EMPTY_CELL = '—';

/**
 * Coluna de NÚMERO: alinha à direita e usa algarismos tabulares — é o que faz
 * uma coluna de valores ser lida como coluna (unidade sob unidade).
 */
function isNumeric(type?: ColumnSpec['type']): boolean {
  return type === 'number';
}

/** Valor formatado por tipo (o mesmo formato que o bloco sempre exibiu). */
export function formatCell(value: unknown, type?: ColumnSpec['type']): string {
  if (value == null) return EMPTY_CELL;
  if (type === 'number') {
    // `numeric` do Postgres chega como string — coage antes de formatar.
    const n = toNumber(value);
    return n != null ? formatNumberBR(n, 2) : String(value);
  }
  if (type === 'boolean') return value ? 'Sim' : 'Não';
  if (type === 'date') return fmtDate(value) ?? String(value);
  return String(value);
}

/**
 * Rótulo de coluna, em TEXTO PURO — e é de propósito.
 *
 * O cabeçalho deste bloco é clicável (ordenação), e o DS deriva o rótulo
 * acessível do botão do `header` da coluna: um `header` que não seja `string`
 * faz o botão anunciar a CHAVE da coluna ("Ordenar por municipio") em vez do
 * rótulo. Então aqui a interpolação é resolvida antes, para texto.
 *
 * A interpolação só roda quando o rótulo declara variável: alias de consulta
 * (`valor_total`) perderia o underscore para a remoção de marcação do markdown.
 * Mesma regra que os gráficos aplicam a texto vindo do dado.
 */
export function headerLabel(label: string, scope?: ChartScope): string {
  return scope && hasVariables(label) ? chartPlainText(label, scope) : label;
}

/**
 * Colunas do DS: largura proporcional, número à direita, todas ordenáveis.
 *
 * TIPOGRAFIA (referência `01-fundamentos.md` §3/§4): o rótulo de coluna fica com
 * o padrão do `TableHeaderCell` — 12,25px/600 na cor secundária (`#637381`), o
 * mesmo degrau do subtítulo do card (§05-4) —, e a célula sai no corpo (14px) na
 * cor principal (`#1C252E`). São os dois papéis de texto da referência aplicados
 * ao par cabeçalho/corpo.
 *
 * `scope` é opcional: sem ele a célula ainda renderiza Markdown, só não resolve
 * `{{variavel}}`.
 */
export function buildColumns(
  specs: ColumnSpec[],
  scope?: ChartScope,
): TableColumn<Row>[] {
  return specs.map((spec) => {
    const numeric = isNumeric(spec.type);
    return {
      key: spec.key,
      header: headerLabel(spec.label, scope),
      width: proportional(1),
      align: numeric ? 'end' : 'start',
      sortable: true,
      // O `Text` fica EM LINHA de propósito: `align` já alinha a célula, e o
      // corte com reticências do DS (`textOverflow="truncate"`) só age sobre
      // conteúdo em linha — um bloco aqui clipava o texto sem as reticências.
      renderCell: (item: Row) => {
        const text = formatCell(item[spec.key], spec.type);
        return (
          <Text color="primary" hasTabularNumbers={numeric}>
            {numeric ? text : <ChartText value={text} scope={scope} />}
          </Text>
        );
      },
    };
  });
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
