/**
 * COMPONENTE PRÓPRIO — equivalente TEXTUAL de um gráfico, só para leitor de
 * tela.
 *
 * O `ChartFrame` já anuncia o gráfico como imagem de dados e carrega um
 * `summary` de uma linha ("2 séries, 12 pontos, maior valor: 182"). Isso
 * resolve "o que é este desenho", mas não "quanto deu em março": os números do
 * eixo vivem dentro do SVG, onde nenhum leitor de tela navega.
 *
 * Este componente publica os MESMOS dados plotados como uma tabela de verdade
 * (`caption` + cabeçalho + linhas), visualmente escondida. É o padrão de
 * acessibilidade para data-viz — a figura para quem vê, a tabela para quem
 * ouve — e vale para qualquer gráfico com eixo, então mora aqui em vez de ser
 * recriado em cada bloco do catálogo.
 *
 * Só apresentação: recebe tudo JÁ FORMATADO (quem plota é quem sabe a moeda, a
 * escala e o idioma).
 *
 * ---------------------------------------------------------------------------
 * CONFORMIDADE VISUAL (briefing §4) — este componente NÃO PINTA NADA
 * ---------------------------------------------------------------------------
 * Ele vive inteiro dentro de `VisuallyHidden`: nenhum pixel dele chega à tela,
 * em nenhum estado (não é o padrão "skip link", que reaparece no foco). Logo
 * não há cor, tipografia, grade nem hover a alinhar — os sete itens da
 * checklist do briefing §4 são todos "não se aplica" aqui, e é justamente por
 * isso que ele continua sendo um `<table>` semântico cru:
 *
 *  - montar isto com o `Table` do design system custaria um provider de
 *    contexto, um wrapper de rolagem e um pipeline de plugins POR GRÁFICO da
 *    página, para produzir zero pixel;
 *  - o que importa aqui é o contrato de acessibilidade — `caption`, `<th
 *    scope="col">` no cabeçalho e `<th scope="row">` na primeira célula —, e
 *    esse contrato é do HTML, não do DS.
 *
 * O alinhamento ao vocabulário das tabelas VISÍVEIS (blocos `table`,
 * `data_table`, `invoice_table`) é o que dá para alinhar sem pintar: a mesma
 * marca de célula sem valor (travessão) e a mesma promessa de que uma linha
 * nunca fica mais curta que o cabeçalho. Decisão registrada em
 * `docs/charts/NOTAS.md` (`[SUB-12]`).
 */
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden';

export interface ChartDataTableProps {
  /** Legenda da tabela: o que estes dados representam. */
  caption: string;
  /** Cabeçalhos das colunas. O primeiro identifica a linha (ex.: "Mês"). */
  columns: string[];
  /** Linhas já formatadas; a primeira célula é o cabeçalho da linha. */
  rows: string[][];
  /** Teto de linhas publicadas (ver `DEFAULT_MAX_ROWS`). */
  maxRows?: number;
}

/**
 * Teto de linhas. Uma série pode trazer milhares de pontos, e despejar tudo no
 * DOM pesaria a página para TODO mundo por causa de uma minoria que ouve. O
 * recorte é anunciado na legenda, então ninguém é levado a achar que viu o
 * conjunto inteiro.
 */
const DEFAULT_MAX_ROWS = 50;

/**
 * Célula sem valor. O MESMO travessão que os blocos tabulares visíveis usam —
 * quem ouve a tabela e quem lê a tabela recebem a mesma marca para "não há
 * valor aqui", em vez de um silêncio de um lado e um traço do outro.
 */
const EMPTY_CELL = '—';

/**
 * Completa uma linha curta até o número de colunas.
 *
 * Linha mais curta que o cabeçalho quebra a associação célula↔coluna do leitor
 * de tela (a partir do buraco, tudo escorrega uma coluna). Como o componente
 * recebe as linhas já montadas por quem plota, a defesa fica aqui — e é um
 * no-op para as linhas bem formadas, que são a regra.
 *
 * Célula SOBRANDO não é cortada de propósito: seria esconder dado.
 */
function padRow(cells: string[], size: number): string[] {
  if (cells.length >= size) return cells;
  return [...cells, ...Array<string>(size - cells.length).fill(EMPTY_CELL)];
}

/** Tabela de dados equivalente ao gráfico, exposta só a leitores de tela. */
export function ChartDataTable({
  caption,
  columns,
  rows,
  maxRows = DEFAULT_MAX_ROWS,
}: ChartDataTableProps) {
  if (rows.length === 0 || columns.length === 0) return null;

  const visible = rows.slice(0, maxRows);
  const label =
    visible.length < rows.length
      ? `${caption} (primeiras ${visible.length} de ${rows.length} linhas)`
      : caption;

  return (
    <VisuallyHidden as="div">
      <table data-slot="chart-data-table">
        <caption>{label}</caption>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={`${column}-${index}`} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((row, rowIndex) => {
            const cells = padRow(row, columns.length);
            return (
              <tr key={`${cells[0]}-${rowIndex}`}>
                <th scope="row">{cells[0]}</th>
                {cells.slice(1).map((cell, cellIndex) => (
                  <td key={`${cell}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </VisuallyHidden>
  );
}
