/**
 * Função pura por trás do `MiddleTruncation`. Fica num arquivo próprio porque é
 * lógica reutilizável (tabelas e tooltips também precisam do texto encurtado) e
 * porque um arquivo de componente não deve co-exportar helpers.
 */

/**
 * Corta um texto no MEIO, preservando início e fim — o oposto do `maxLines` do
 * `Text`, que come justamente o fim (extensão, id, sufixo).
 *
 * Textos dentro de `maxLength` voltam inteiros. `minEnd` garante um mínimo de
 * caracteres preservados à direita (ex.: `4` mantém `.sql`).
 */
export function truncateMiddle(
  text: string,
  maxLength = 20,
  ellipsis = '…',
  minEnd?: number,
): string {
  if (text.length <= maxLength) return text;
  const budget = Math.max(maxLength - ellipsis.length, 0);
  const endChars = Math.min(minEnd ?? Math.floor(budget / 2), budget);
  const startChars = Math.max(budget - endChars, 0);
  return (
    text.slice(0, startChars) + ellipsis + (endChars > 0 ? text.slice(-endChars) : '')
  );
}
