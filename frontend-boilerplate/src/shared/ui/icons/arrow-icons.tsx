/**
 * Setas e apoio da PRÓPRIA navegação — coleção `eva`, como no original
 * (CONTRATO da sidebar §6). São os únicos ícones da nav que não são Solar:
 * a origem usa `eva` em toda seta de interface (46 e 37 usos dos dois
 * primeiros, segundo o catálogo do pacote).
 */

import type { SVGProps } from 'react';

import { IconBase } from './icon-base';

/**
 * `eva:arrow-ios-forward-fill` — item com filhos FECHADO.
 */
export function ArrowIosForwardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M10 19a1 1 0 0 1-.64-.23a1 1 0 0 1-.13-1.41L13.71 12L9.39 6.63a1 1 0 0 1 .15-1.41a1 1 0 0 1 1.46.15l4.83 6a1 1 0 0 1 0 1.27l-5 6A1 1 0 0 1 10 19"
      />
    </IconBase>
  );
}

/**
 * `eva:arrow-ios-downward-fill` — item com filhos ABERTO.
 */
export function ArrowIosDownwardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M12 16a1 1 0 0 1-.64-.23l-6-5a1 1 0 1 1 1.28-1.54L12 13.71l5.36-4.32a1 1 0 0 1 1.41.15a1 1 0 0 1-.14 1.46l-6 4.83A1 1 0 0 1 12 16"
      />
    </IconBase>
  );
}

/**
 * `eva:arrow-ios-back-fill` — botão de recolher a barra.
 */
export function ArrowIosBackIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M13.83 19a1 1 0 0 1-.78-.37l-4.83-6a1 1 0 0 1 0-1.27l5-6a1 1 0 0 1 1.54 1.28L10.29 12l4.32 5.36a1 1 0 0 1-.78 1.64"
      />
    </IconBase>
  );
}

/**
 * `eva:info-outline` — marca a legenda (`caption`) na forma mini.
 */
export function InfoOutlineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2m0 18a8 8 0 1 1 8-8a8 8 0 0 1-8 8"
      />
      <circle cx="12" cy="8" r="1" fill="currentColor" />
      <path
        fill="currentColor"
        d="M12 10a1 1 0 0 0-1 1v5a1 1 0 0 0 2 0v-5a1 1 0 0 0-1-1"
      />
    </IconBase>
  );
}
