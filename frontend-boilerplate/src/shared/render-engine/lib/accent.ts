/**
 * Acento de cor dos blocos do catálogo — o VOCABULÁRIO, e só ele.
 *
 * `accent` é a prop com que um bloco pede destaque de cor. É um ENUM fechado
 * (não string livre) por três motivos:
 *  - o `manifest.propsSchema` é validado com ajv no backend/IA: enum barra
 *    valor inválido na borda, em vez de quebrar em runtime no front;
 *  - o agente e o editor de blocos ganham autocomplete exato;
 *  - impede que cor crua (hex, `rgb()`, `bg-purple-500`) entre pelo contrato.
 *
 * ⚠️ Este arquivo NÃO resolve mais cor. Até a migração para o Astryx ele
 * traduzia o acento para classe Tailwind do tema legado (`bg-chart-1`,
 * `stroke-chart-2`) e tinha um resolvedor para as strings livres do
 * playground. Esses nomes morreram junto com `legacy-theme.css`.
 * Quem traduz acento → token de data-viz agora é `chartAccentColor()`
 * (`@/shared/ui`), que devolve `var(--color-data-*)` do tema ativo.
 */

/** Acento de cor aceito pelos blocos de série única. */
export type AccentColor =
  | 'chart-1'
  | 'chart-2'
  | 'chart-3'
  | 'chart-4'
  | 'chart-5'
  | 'primary';

/** Lista de acentos válidos (mesma ordem do tipo) — vira `enum` no JSON Schema. */
export const ACCENT_COLORS: readonly AccentColor[] = [
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'primary',
] as const;

/**
 * O valor recebido é um acento do catálogo?
 *
 * Usado pelo playground, que aceita digitação livre no campo de cor: o que não
 * for acento válido é tratado como legado e cai na paleta do tema, nunca vira
 * cor crua na tela.
 */
export function isAccentColor(value: unknown): value is AccentColor {
  return (
    typeof value === 'string' && (ACCENT_COLORS as readonly string[]).includes(value)
  );
}
