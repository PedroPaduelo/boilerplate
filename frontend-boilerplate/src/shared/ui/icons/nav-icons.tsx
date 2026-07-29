/**
 * Ícones dos ITENS DE MENU, na variante exata que a origem usa em
 * `layouts/nav-config-dashboard.tsx` — a tabela do §6 do CONTRATO da sidebar.
 *
 * Cada traçado é cópia literal do SVG do pacote (`icones-auditoria`), sem
 * redesenho: é o que separa "o ícone certo" de "um ícone parecido".
 */

import type { SVGProps } from 'react';

import { IconBase } from './icon-base';

/**
 * `solar:home-angle-bold-duotone` — item **Início**.
 */
export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M13.106 22h-2.212c-3.447 0-5.17 0-6.345-1.012s-1.419-2.705-1.906-6.093l-.279-1.937c-.38-2.637-.57-3.956-.029-5.083s1.691-1.813 3.992-3.183l1.385-.825C9.8 2.622 10.846 2 12 2s2.199.622 4.288 1.867l1.385.825c2.3 1.37 3.451 2.056 3.992 3.183s.35 2.446-.03 5.083l-.278 1.937c-.487 3.388-.731 5.081-1.906 6.093S16.553 22 13.106 22"
        opacity="0.4"
      />
      <path
        fill="currentColor"
        d="M8.25 18a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75"
      />
    </IconBase>
  );
}

/**
 * `solar:chart-2-line-duotone` — item **Dashboards**.
 */
export function DashboardsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <g fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 22h18" opacity=".5" />
        <path d="M3 11c0-.943 0-1.414.293-1.707S4.057 9 5 9s1.414 0 1.707.293S7 10.057 7 11v6c0 .943 0 1.414-.293 1.707S5.943 19 5 19s-1.414 0-1.707-.293S3 17.943 3 17zm7-4c0-.943 0-1.414.293-1.707S11.057 5 12 5s1.414 0 1.707.293S14 6.057 14 7v10c0 .943 0 1.414-.293 1.707S12.943 19 12 19s-1.414 0-1.707-.293S10 17.943 10 17zm7-3c0-.943 0-1.414.293-1.707S18.057 2 19 2s1.414 0 1.707.293S21 3.057 21 4v13c0 .943 0 1.414-.293 1.707S19.943 19 19 19s-1.414 0-1.707-.293S17 17.943 17 17z" />
      </g>
    </IconBase>
  );
}

/**
 * `solar:chart-square-bold-duotone` — item **Gráficos**.
 */
export function ChartsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M12 22c-4.714 0-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12s0-7.071 1.464-8.536C4.93 2 7.286 2 12 2s7.071 0 8.535 1.464C22 4.93 22 7.286 22 12s0 7.071-1.465 8.535C19.072 22 16.714 22 12 22"
        opacity=".5"
      />
      <path
        fill="currentColor"
        d="M12 5.25a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75m-5 3a.75.75 0 0 1 .75.75v9a.75.75 0 0 1-1.5 0V9A.75.75 0 0 1 7 8.25m10 4a.75.75 0 0 1 .75.75v5a.75.75 0 0 1-1.5 0v-5a.75.75 0 0 1 .75-.75"
      />
    </IconBase>
  );
}

/**
 * `solar:library-broken` — item **Catálogo**.
 */
export function CatalogIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <g fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M19.562 7a2.132 2.132 0 0 0-2.1-2.5H6.538a2.132 2.132 0 0 0-2.1 2.5M17.5 4.5c.028-.26.043-.389.043-.496a2 2 0 0 0-1.787-1.993C15.65 2 15.52 2 15.26 2H8.74c-.26 0-.391 0-.497.011a2 2 0 0 0-1.787 1.993c0 .107.014.237.043.496" />
        <path
          strokeLinecap="round"
          d="M15 18H9m12.194-1.207c-.35 2.48-.525 3.721-1.422 4.464s-2.22.743-4.867.743h-5.81c-2.646 0-3.97 0-4.867-.743s-1.072-1.983-1.422-4.464l-.422-3c-.447-3.164-.67-4.745.278-5.77C3.61 7 5.298 7 8.672 7h6.656c3.374 0 5.062 0 6.01 1.024c.749.809.767 1.966.521 3.976"
        />
      </g>
    </IconBase>
  );
}

/**
 * `solar:server-path-broken` — item **Conexões**.
 */
export function ConnectionsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <g fill="none">
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.5"
          d="M22 19h-8M2 19h8m2-2v-3"
        />
        <circle cx="12" cy="19" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.5"
          d="M14 14H5a3 3 0 1 1 0-6h14a3 3 0 1 1 0 6h-1M12 2h7a3 3 0 1 1 0 6H5a3 3 0 0 1 0-6h3m5 3h6m-6 6h6"
        />
        <circle cx="6" cy="5" r="1" fill="currentColor" />
        <circle cx="6" cy="11" r="1" fill="currentColor" />
      </g>
    </IconBase>
  );
}

/**
 * `solar:chat-round-dots-bold` — item **Chat**.
 */
export function ChatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22 12C22 17.523 17.523 22 12 22C10.4551 22.002 8.93095 21.6446 7.548 20.956C7.19414 20.7727 6.78538 20.7254 6.399 20.823L4.173 21.419C3.95267 21.4778 3.72075 21.4776 3.50053 21.4184C3.2803 21.3593 3.07951 21.2432 2.91831 21.0819C2.75712 20.9206 2.64119 20.7197 2.58216 20.4995C2.52312 20.2792 2.52307 20.0473 2.582 19.827L3.177 17.601C3.28 17.216 3.221 16.809 3.043 16.453C2.376 15.112 2 13.6 2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12ZM15.2929 12.7071C15.1054 12.5196 15 12.2652 15 12C15 11.7348 15.1054 11.4804 15.2929 11.2929C15.4804 11.1054 15.7348 11 16 11C16.2652 11 16.5196 11.1054 16.7071 11.2929C16.8946 11.4804 17 11.7348 17 12C17 12.2652 16.8946 12.5196 16.7071 12.7071C16.5196 12.8946 16.2652 13 16 13C15.7348 13 15.4804 12.8946 15.2929 12.7071ZM11.2929 12.7071C11.1054 12.5196 11 12.2652 11 12C11 11.7348 11.1054 11.4804 11.2929 11.2929C11.4804 11.1054 11.7348 11 12 11C12.2652 11 12.5196 11.1054 12.7071 11.2929C12.8946 11.4804 13 11.7348 13 12C13 12.2652 12.8946 12.5196 12.7071 12.7071C12.5196 12.8946 12.2652 13 12 13C11.7348 13 11.4804 12.8946 11.2929 12.7071ZM7.29289 12.7071C7.10536 12.5196 7 12.2652 7 12C7 11.7348 7.10536 11.4804 7.29289 11.2929C7.48043 11.1054 7.73478 11 8 11C8.26522 11 8.51957 11.1054 8.70711 11.2929C8.89464 11.4804 9 11.7348 9 12C9 12.2652 8.89464 12.5196 8.70711 12.7071C8.51957 12.8946 8.26522 13 8 13C7.73478 13 7.48043 12.8946 7.29289 12.7071Z"
      />
    </IconBase>
  );
}

/**
 * `solar:users-group-rounded-broken` — item **Usuários**.
 */
export function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <g fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="9" cy="6" r="4" />
        <path
          strokeLinecap="round"
          d="M15 9a3 3 0 1 0 0-6M5.89 20.584C6.825 20.85 7.882 21 9 21c3.866 0 7-1.79 7-4s-3.134-4-7-4s-7 1.79-7 4c0 .345.077.68.22 1M18 14c1.754.385 3 1.359 3 2.5c0 1.03-1.014 1.923-2.5 2.37"
        />
      </g>
    </IconBase>
  );
}
