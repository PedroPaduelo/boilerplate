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
          {visible.map((cells, rowIndex) => (
            <tr key={`${cells[0]}-${rowIndex}`}>
              <th scope="row">{cells[0]}</th>
              {cells.slice(1).map((cell, cellIndex) => (
                <td key={`${cell}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </VisuallyHidden>
  );
}
