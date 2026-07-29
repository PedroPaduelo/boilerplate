/**
 * Ícones semânticos de ESTADO E CONTEXTO (alerta, confirmação, tempo, lugar,
 * etiqueta, busca, ajuste) e o MARCADOR NEUTRO do fallback.
 * Consumidos por `../semantic-icons.ts`.
 */

import type { SVGProps } from 'react';

import { IconBase } from './icon-base';

/**
 * `solar:danger-triangle-bold-duotone` — chave `alert`.
 *
 * Triângulo, não octógono: na origem, triângulo é ATENÇÃO e octógono
 * (`danger-bold`) é ERRO — a distinção é proposital (doc 06 §5.2).
 */
export function AlertIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M12 3c-2.31 0-3.77 2.587-6.688 7.762l-.364.644c-2.425 4.3-3.638 6.45-2.542 8.022S6.214 21 11.636 21h.728c5.422 0 8.134 0 9.23-1.572s-.117-3.722-2.542-8.022l-.364-.645C15.77 5.587 14.311 3 12 3"
        opacity=".5"
      />
      <path
        fill="currentColor"
        d="M12 7.25a.75.75 0 0 1 .75.75v5a.75.75 0 0 1-1.5 0V8a.75.75 0 0 1 .75-.75M12 17a1 1 0 1 0 0-2a1 1 0 0 0 0 2"
      />
    </IconBase>
  );
}

/**
 * `solar:check-circle-bold-duotone` — chave `check`.
 */
export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2s10 4.477 10 10"
        opacity=".5"
      />
      <path
        fill="currentColor"
        d="M16.03 8.97a.75.75 0 0 1 0 1.06l-5 5a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 1 1 1.06-1.06l1.47 1.47l2.235-2.235L14.97 8.97a.75.75 0 0 1 1.06 0"
      />
    </IconBase>
  );
}

/**
 * `solar:clock-circle-bold-duotone` — chave `clock`.
 */
export function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12s4.477 10 10 10"
        opacity=".5"
      />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M12 7.25a.75.75 0 0 1 .75.75v3.69l2.28 2.28a.75.75 0 1 1-1.06 1.06l-2.5-2.5a.75.75 0 0 1-.22-.53V8a.75.75 0 0 1 .75-.75"
        clipRule="evenodd"
      />
    </IconBase>
  );
}

/**
 * `solar:calendar-bold-duotone` — chave `calendar`.
 */
export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M6.94 2c.416 0 .753.324.753.724v1.46c.668-.012 1.417-.012 2.26-.012h4.015c.842 0 1.591 0 2.259.013v-1.46c0-.4.337-.725.753-.725s.753.324.753.724V4.25c1.445.111 2.394.384 3.09 1.055c.698.67.982 1.582 1.097 2.972L22 9H2v-.724c.116-1.39.4-2.302 1.097-2.972s1.645-.944 3.09-1.055V2.724c0-.4.337-.724.753-.724"
      />
      <path
        fill="currentColor"
        d="M22 14v-2c0-.839-.004-2.335-.017-3H2.01c-.013.665-.01 2.161-.01 3v2c0 3.771 0 5.657 1.172 6.828S6.228 22 10 22h4c3.77 0 5.656 0 6.828-1.172S22 17.772 22 14"
        opacity=".5"
      />
      <path
        fill="currentColor"
        d="M18 17a1 1 0 1 1-2 0a1 1 0 0 1 2 0m0-4a1 1 0 1 1-2 0a1 1 0 0 1 2 0m-5 4a1 1 0 1 1-2 0a1 1 0 0 1 2 0m0-4a1 1 0 1 1-2 0a1 1 0 0 1 2 0m-5 4a1 1 0 1 1-2 0a1 1 0 0 1 2 0m0-4a1 1 0 1 1-2 0a1 1 0 0 1 2 0"
      />
    </IconBase>
  );
}

/**
 * `solar:tag-horizontal-bold-duotone` — chave `tag`.
 */
export function TagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M10.221 20h2.637c2.227 0 3.341 0 4.27-.501c.93-.502 1.52-1.42 2.701-3.259l.681-1.06C21.503 13.634 22 12.86 22 12s-.497-1.634-1.49-3.18l-.68-1.06c-1.181-1.838-1.771-2.757-2.701-3.259S15.085 4 12.858 4h-2.637C6.346 4 4.408 4 3.204 5.172S2 8.229 2 12s0 5.657 1.204 6.828S6.346 20 10.22 20"
        opacity="0.4"
      />
      <path
        fill="currentColor"
        d="M7 7.055c.414 0 .75.316.75.706v8.475c0 .39-.336.706-.75.706s-.75-.316-.75-.706V7.76c0-.39.336-.706.75-.706"
      />
    </IconBase>
  );
}

/**
 * `solar:map-point-bold-duotone` — chave `map`.
 */
export function MapPointIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M12 2c-4.418 0-8 4.003-8 8.5c0 4.462 2.553 9.312 6.537 11.174a3.45 3.45 0 0 0 2.926 0C17.447 19.812 20 14.962 20 10.5C20 6.003 16.418 2 12 2"
        opacity=".5"
      />
      <path fill="currentColor" d="M12 12.5a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5" />
    </IconBase>
  );
}

/**
 * `eva:search-fill` — chave `search`.
 *
 * A lupa do Solar (`magnifer-*`) não veio no pacote; o que há é
 * `card-search-broken`, que é "consultar um CADASTRO", não busca em geral.
 * `eva:search-fill` é a lupa que o próprio design system de origem usa
 * como ícone de busca (`DataGridSearchIcon`, doc 06 §5.8).
 */
export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="m20.71 19.29l-3.4-3.39A7.92 7.92 0 0 0 19 11a8 8 0 1 0-8 8a7.92 7.92 0 0 0 4.9-1.69l3.39 3.4a1 1 0 0 0 1.42 0a1 1 0 0 0 0-1.42M5 11a6 6 0 1 1 6 6a6 6 0 0 1-6-6"
      />
    </IconBase>
  );
}

/**
 * `solar:settings-bold-duotone` — chave `settings`.
 */
export function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M14.279 2.152C13.909 2 13.439 2 12.5 2s-1.408 0-1.779.152a2 2 0 0 0-1.09 1.083c-.094.223-.13.484-.145.863a1.62 1.62 0 0 1-.796 1.353a1.64 1.64 0 0 1-1.579.008c-.338-.178-.583-.276-.825-.308a2.03 2.03 0 0 0-1.49.396c-.318.242-.553.646-1.022 1.453c-.47.807-.704 1.21-.757 1.605c-.07.526.074 1.058.4 1.479c.148.192.357.353.68.555c.477.297.783.803.783 1.361s-.306 1.064-.782 1.36c-.324.203-.533.364-.682.556a2 2 0 0 0-.399 1.479c.053.394.287.798.757 1.605s.704 1.21 1.022 1.453c.424.323.96.465 1.49.396c.242-.032.487-.13.825-.308a1.64 1.64 0 0 1 1.58.008c.486.28.774.795.795 1.353c.015.38.051.64.145.863c.204.49.596.88 1.09 1.083c.37.152.84.152 1.779.152s1.409 0 1.779-.152a2 2 0 0 0 1.09-1.083c.094-.223.13-.483.145-.863c.02-.558.309-1.074.796-1.353a1.64 1.64 0 0 1 1.579-.008c.338.178.583.276.825.308c.53.07 1.066-.073 1.49-.396c.318-.242.553-.646 1.022-1.453c.47-.807.704-1.21.757-1.605a2 2 0 0 0-.4-1.479c-.148-.192-.357-.353-.68-.555c-.477-.297-.783-.803-.783-1.361s.306-1.064.782-1.36c.324-.203.533-.364.682-.556a2 2 0 0 0 .399-1.479c-.053-.394-.287-.798-.757-1.605s-.704-1.21-1.022-1.453a2.03 2.03 0 0 0-1.49-.396c-.242.032-.487.13-.825.308a1.64 1.64 0 0 1-1.58-.008a1.62 1.62 0 0 1-.795-1.353c-.015-.38-.051-.64-.145-.863a2 2 0 0 0-1.09-1.083"
        clipRule="evenodd"
        opacity="0.4"
      />
      <path
        fill="currentColor"
        d="M15.523 12c0 1.657-1.354 3-3.023 3s-3.023-1.343-3.023-3S10.83 9 12.5 9s3.023 1.343 3.023 3"
      />
    </IconBase>
  );
}

/**
 * `eva:radio-button-off-fill` — o MARCADOR NEUTRO do fallback.
 *
 * Um anel vazio, sem significado próprio: é o que segura o alinhamento da
 * lista quando o item não declara ícone. Nenhum Solar do pacote é um
 * círculo neutro (os que existem carregam símbolo dentro: parar, proibido,
 * tocar), e um símbolo aqui diria algo que o item não disse.
 */
export function NeutralMarkerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M12 22a10 10 0 1 1 10-10a10 10 0 0 1-10 10m0-18a8 8 0 1 0 8 8a8 8 0 0 0-8-8"
      />
    </IconBase>
  );
}
