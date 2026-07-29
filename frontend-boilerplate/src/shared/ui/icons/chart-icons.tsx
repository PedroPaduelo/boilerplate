/**
 * Ícones semânticos de VISUALIZAÇÃO (visão geral, colunas, tendência, fatias,
 * pulso). Consumidos por `../semantic-icons.ts` — o mapa "nome do contrato →
 * desenho".
 *
 * Onde a coleção Solar do pacote não tinha equivalente, o JSDoc registra o que
 * foi escolhido no lugar e por quê.
 */

import type { SVGProps } from 'react';

import { IconBase } from './icon-base';

/**
 * `solar:feed-broken` — chave `overview`.
 *
 * A coleção Solar do pacote não traz um "layout de painéis" (`widget-*`
 * não veio nos 387 arquivos). `feed-broken` é o que a origem usa em
 * `layouts/nav-config-dashboard.tsx` para a visão geral de conteúdo:
 * moldura com um bloco dentro e a linha de título acima.
 */
export function OverviewIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <g fill="none" stroke="currentColor" strokeWidth="1.5">
        <path
          strokeLinecap="round"
          d="M20.965 7c-.078-1.872-.328-3.02-1.137-3.828C18.657 2 16.771 2 13 2h-2C7.229 2 5.343 2 4.172 3.172S3 6.229 3 10v4c0 3.771 0 5.657 1.172 6.828S7.229 22 11 22h2c3.771 0 5.657 0 6.828-1.172S21 17.771 21 14v-3"
        />
        <path d="M6 12c0-1.414 0-2.121.44-2.56C6.878 9 7.585 9 9 9h6c1.414 0 2.121 0 2.56.44c.44.439.44 1.146.44 2.56v4c0 1.414 0 2.121-.44 2.56c-.439.44-1.146.44-2.56.44H9c-1.414 0-2.121 0-2.56-.44C6 18.122 6 17.415 6 16z" />
        <path strokeLinecap="round" d="M7 6h5" />
      </g>
    </IconBase>
  );
}

/**
 * `solar:chart-2-bold-duotone` — chave `chart` (colunas).
 */
export function BarChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M3.293 9.293C3 9.586 3 10.057 3 11v6c0 .943 0 1.414.293 1.707S4.057 19 5 19s1.414 0 1.707-.293S7 17.943 7 17v-6c0-.943 0-1.414-.293-1.707S5.943 9 5 9s-1.414 0-1.707.293"
      />
      <path
        fill="currentColor"
        d="M17.293 2.293C17 2.586 17 3.057 17 4v13c0 .943 0 1.414.293 1.707S18.057 19 19 19s1.414 0 1.707-.293S21 17.943 21 17V4c0-.943 0-1.414-.293-1.707S19.943 2 19 2s-1.414 0-1.707.293"
        opacity=".4"
      />
      <path
        fill="currentColor"
        d="M10 7c0-.943 0-1.414.293-1.707S11.057 5 12 5s1.414 0 1.707.293S14 6.057 14 7v10c0 .943 0 1.414-.293 1.707S12.943 19 12 19s-1.414 0-1.707-.293S10 17.943 10 17z"
        opacity=".7"
      />
      <path fill="currentColor" d="M3 21.25a.75.75 0 0 0 0 1.5h18a.75.75 0 0 0 0-1.5z" />
    </IconBase>
  );
}

/**
 * `solar:graph-up-bold` — chave `trend`.
 *
 * É o único traçado do pacote com linha ASCENDENTE e seta (o `TrendingUp`
 * que o mapa substitui). O pacote não traz variante duotone dele.
 */
export function TrendUpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M3.464 3.464C2 4.93 2 7.286 2 12s0 7.071 1.464 8.535C4.93 22 7.286 22 12 22s7.071 0 8.535-1.465C22 19.072 22 16.714 22 12s0-7.071-1.465-8.536C19.072 2 16.714 2 12 2S4.929 2 3.464 3.464M13.75 10c0 .414.336.75.75.75h.69l-2.013 2.013a.25.25 0 0 1-.354 0l-1.586-1.586a1.75 1.75 0 0 0-2.474 0L6.47 13.47a.75.75 0 1 0 1.06 1.06l2.293-2.293a.25.25 0 0 1 .354 0l1.586 1.586a1.75 1.75 0 0 0 2.474 0l2.013-2.012v.689a.75.75 0 0 0 1.5 0V10a.75.75 0 0 0-.75-.75h-2.5a.75.75 0 0 0-.75.75"
        clipRule="evenodd"
      />
    </IconBase>
  );
}

/**
 * `solar:pie-chart-bold-duotone` — chave `pie`.
 */
export function PieChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M9.163 3.775a.75.75 0 0 1-.49.94A8.465 8.465 0 0 0 2.75 12.79a8.46 8.46 0 0 0 8.46 8.461a8.465 8.465 0 0 0 8.075-5.922a.75.75 0 1 1 1.43.45c-1.268 4.04-5.043 6.972-9.504 6.972c-5.501 0-9.961-4.46-9.961-9.96c0-4.462 2.932-8.236 6.973-9.506a.75.75 0 0 1 .94.491"
        clipRule="evenodd"
        opacity=".5"
      />
      <path
        fill="currentColor"
        d="M21.913 9.947a11.35 11.35 0 0 0-7.86-7.86C12.409 1.628 11 3.054 11 4.76v6.694c0 .853.692 1.545 1.545 1.545h6.694c1.707 0 3.133-1.41 2.674-3.053"
      />
    </IconBase>
  );
}

/**
 * `eva:activity-fill` — chave `activity`.
 *
 * Solar não tem linha de pulso em nenhuma variante do pacote; `eva` tem
 * exatamente o traçado do `Activity` que o mapa substitui. `eva` já é
 * coleção de primeira classe aqui (é a das setas da navegação).
 */
export function ActivityIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M14.33 20h-.21a2 2 0 0 1-1.76-1.58L9.68 6l-2.76 6.4A1 1 0 0 1 6 13H3a1 1 0 0 1 0-2h2.34l2.51-5.79a2 2 0 0 1 3.79.38L14.32 18l2.76-6.38A1 1 0 0 1 18 11h3a1 1 0 0 1 0 2h-2.34l-2.51 5.79A2 2 0 0 1 14.33 20"
      />
    </IconBase>
  );
}
