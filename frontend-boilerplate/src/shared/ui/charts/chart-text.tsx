/**
 * TEXTO DE BLOCO — markdown inline + interpolação de variáveis, num lugar só.
 *
 * O contrato comum do catálogo diz que QUALQUER campo de texto de um bloco
 * (título, subtítulo, descrição, rótulo, tooltip, rodapé, estado vazio) aceita
 * Markdown e `{{variavel}}` resolvida a partir dos dados. Este é o componente
 * que cumpre isso — e é o único; nenhum bloco reimplementa.
 *
 * Para onde HTML não entra (`aria-label`, `<text>` do SVG), use
 * `chartPlainText` de `chart-text-html.ts`.
 *
 * Variável inexistente NÃO some: fica visível e marcada, para quem está
 * configurando o bloco perceber o campo errado na hora.
 */
import { chartTextHtml } from './chart-text-html';
import type { ChartScope } from './chart-template';

export interface ChartTextProps {
  /** Texto cru, com Markdown e `{{variaveis}}`. */
  value: string | undefined | null;
  /** Escopo de interpolação (de `buildChartScope`). */
  scope?: ChartScope;
  /** Elemento envolvente. Default `span` (o texto vive dentro de outro). */
  as?: 'span' | 'div';
  /** Classe extra do envolvente. */
  className?: string;
}

/**
 * Renderiza um campo de texto de bloco: interpola, converte o markdown inline
 * e sanitiza. Sem `scope`, funciona como markdown puro.
 */
export function ChartText({ value, scope, as = 'span', className }: ChartTextProps) {
  const html = chartTextHtml(value, scope);
  if (html === '') return null;

  const Tag = as;
  return (
    <Tag
      data-slot="chart-text"
      className={className ? `chart-md ${className}` : 'chart-md'}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
