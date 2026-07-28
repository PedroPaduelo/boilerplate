/**
 * Interpolação + Markdown → string. Funções PURAS, sem React.
 *
 * Ficam separadas de `chart-text.tsx` porque metade dos consumidores não quer
 * um componente: `aria-label`, `<text>` do SVG, `title` de tooltip e `alt` só
 * aceitam texto. (E porque um arquivo que exporta componente E função quebra o
 * fast refresh.)
 */
import { renderInlineMarkdown } from '@/shared/lib/markdown';
import { interpolate, type ChartScope } from './chart-template';

/** Marca as variáveis que sobraram sem valor, para não sumirem em silêncio. */
const LEFTOVER_PATTERN = /\{\{\s*[\w$.[\]|\s-]+\s*\}\}/g;

/** HTML já interpolado, com markdown inline e variáveis órfãs marcadas. */
export function chartTextHtml(
  value: string | undefined | null,
  scope?: ChartScope,
): string {
  if (!value) return '';
  const { text } = interpolate(value, scope ?? {});
  const html = renderInlineMarkdown(text);
  return html.replace(
    LEFTOVER_PATTERN,
    (match) => `<span class="chart-md__missing">${match}</span>`,
  );
}

/**
 * Versão TEXTO PURO: interpola e remove a marcação. Para onde HTML não entra —
 * `aria-label`, `<text>` do SVG, `title` do tooltip, `alt`.
 */
export function chartPlainText(
  value: string | undefined | null,
  scope?: ChartScope,
): string {
  if (!value) return '';
  const { text } = interpolate(value, scope ?? {});
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // imagem
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // link → só o rótulo
    .replace(/[*_`~]/g, '') // ênfase e código
    .trim();
}
