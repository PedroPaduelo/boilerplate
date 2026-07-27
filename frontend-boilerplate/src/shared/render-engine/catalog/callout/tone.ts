/**
 * Tradução das props de cor do `callout` (`boxColor`/`textColor`) para o
 * vocabulário SEMÂNTICO do design system.
 *
 * O contrato do manifesto (string livre) é preservado — o backend gera o
 * catálogo a partir dele —, mas o valor deixa de virar cor crua: ele é
 * interpretado como um TOM e resolvido para um token do DS.
 *
 *  - `boxColor`  → `status` do Banner (info | success | warning | error);
 *  - `textColor` → `color` do Text (primary | secondary | accent | disabled).
 *
 * Valores legados (classe Tailwind `bg-red-500`, hex `#40E0D0`, gradiente) são
 * degradados com elegância: o prefixo `bg-`/`text-` e o degrau numérico são
 * descartados e o NOME da cor é mapeado para o tom equivalente do DS. O que
 * não tem equivalente (hex, rgb(), gradiente) devolve `undefined` — o bloco
 * cai no tom do `variant`, em vez de pintar um valor mágico na tela.
 */
import type { BannerStatus } from '@astryxdesign/core/Banner';
import type { TextColor } from '@astryxdesign/core/Text';

/** Normaliza: minúsculas, sem acento, sem prefixo utilitário, sem degrau. */
function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^(bg|text|border)-/, '')
    .replace(/-\d{2,3}$/, '')
    .replace(/\/\d+$/, '');
}

/** Nome de tom → severidade do Banner. */
const BOX_TONES: Record<string, BannerStatus> = {
  default: 'info',
  neutral: 'info',
  info: 'info',
  informativo: 'info',
  accent: 'info',
  primary: 'info',
  blue: 'info',
  sky: 'info',
  cyan: 'info',
  indigo: 'info',
  success: 'success',
  sucesso: 'success',
  positivo: 'success',
  green: 'success',
  emerald: 'success',
  teal: 'success',
  warning: 'warning',
  atencao: 'warning',
  alerta: 'warning',
  amber: 'warning',
  yellow: 'warning',
  orange: 'warning',
  error: 'error',
  erro: 'error',
  danger: 'error',
  destructive: 'error',
  critico: 'error',
  red: 'error',
  rose: 'error',
  pink: 'error',
};

/** Nome de tom → cor de texto do DS. */
const TEXT_TONES: Record<string, TextColor> = {
  primary: 'primary',
  foreground: 'primary',
  white: 'primary',
  black: 'primary',
  secondary: 'secondary',
  secundario: 'secondary',
  muted: 'secondary',
  gray: 'secondary',
  grey: 'secondary',
  slate: 'secondary',
  zinc: 'secondary',
  neutral: 'secondary',
  accent: 'accent',
  blue: 'accent',
  sky: 'accent',
  disabled: 'disabled',
  inherit: 'inherit',
};

/** Tom da CAIXA. `undefined` = mantém o tom do `variant`. */
export function resolveBoxTone(value: string | undefined): BannerStatus | undefined {
  if (value == null || value.trim() === '') return undefined;
  return BOX_TONES[normalize(value)];
}

/** Tom do TEXTO. `undefined` = herda a cor do Banner. */
export function resolveTextTone(value: string | undefined): TextColor | undefined {
  if (value == null || value.trim() === '') return undefined;
  return TEXT_TONES[normalize(value)];
}
