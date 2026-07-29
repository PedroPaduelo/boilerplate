/**
 * Ícones semânticos de ESTRUTURA DE DADOS (tabela, lista, camadas, base).
 * Consumidos por `../semantic-icons.ts`.
 *
 * Nenhum dos quatro tem equivalente direto na coleção Solar do pacote — cada
 * JSDoc registra o que entrou no lugar e por quê.
 */

import type { SVGProps } from 'react';

import { IconBase } from './icon-base';

/**
 * `solar:checklist-minimalistic-bold-duotone` — chave `table`.
 *
 * A coleção Solar do pacote não traz grade/tabela. Este é o traçado mais
 * próximo: moldura com linhas pareadas (marcador à esquerda + linha à
 * direita), que lê como linha de tabela — e se distingue de `list`, que
 * são linhas soltas, sem moldura.
 */
export function TableIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M2 12c0-4.714 0-7.071 1.464-8.536C4.93 2 7.286 2 12 2s7.071 0 8.535 1.464C22 4.93 22 7.286 22 12s0 7.071-1.465 8.535C19.072 22 16.714 22 12 22s-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12"
        opacity=".5"
      />
      <path
        fill="currentColor"
        d="M10.543 7.517a.75.75 0 1 0-1.086-1.034l-2.314 2.43l-.6-.63a.75.75 0 1 0-1.086 1.034l1.143 1.2a.75.75 0 0 0 1.086 0zM13 8.25a.75.75 0 0 0 0 1.5h5a.75.75 0 0 0 0-1.5zm-2.457 6.267a.75.75 0 1 0-1.086-1.034l-2.314 2.43l-.6-.63a.75.75 0 1 0-1.086 1.034l1.143 1.2a.75.75 0 0 0 1.086 0zM13 15.25a.75.75 0 0 0 0 1.5h5a.75.75 0 0 0 0-1.5z"
      />
    </IconBase>
  );
}

/**
 * `solar:list-bold` — chave `list`. O pacote não traz variante duotone.
 */
export function ListIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M3.25 7A.75.75 0 0 1 4 6.25h16a.75.75 0 0 1 0 1.5H4A.75.75 0 0 1 3.25 7m0 5a.75.75 0 0 1 .75-.75h11a.75.75 0 0 1 0 1.5H4a.75.75 0 0 1-.75-.75m0 5a.75.75 0 0 1 .75-.75h5a.75.75 0 0 1 0 1.5H4a.75.75 0 0 1-.75-.75"
        clipRule="evenodd"
      />
    </IconBase>
  );
}

/**
 * `solar:documents-bold-duotone` — chave `layers`.
 *
 * Solar não tem `layers` no pacote; folhas EMPILHADAS é o desenho de
 * "camadas" disponível — e contrasta com `document` (uma folha só).
 */
export function LayersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M5.879 2.879C5 3.757 5 5.172 5 8v8c0 2.828 0 4.243.879 5.121C6.757 22 8.172 22 11 22h2c2.828 0 4.243 0 5.121-.879C19 20.243 19 18.828 19 16V8c0-2.828 0-4.243-.879-5.121C17.243 2 15.828 2 13 2h-2c-2.828 0-4.243 0-5.121.879M8.25 17a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75M9 12.25a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5zM8.25 9A.75.75 0 0 1 9 8.25h6a.75.75 0 0 1 0 1.5H9A.75.75 0 0 1 8.25 9"
        clipRule="evenodd"
      />
      <path
        fill="currentColor"
        d="M5.235 4.058C5 4.941 5 6.177 5 8v8c0 1.823 0 3.058.235 3.942L5 19.924c-.975-.096-1.631-.313-2.121-.803C2 18.243 2 16.828 2 14v-4c0-2.829 0-4.243.879-5.121c.49-.49 1.146-.707 2.121-.803zm13.53 15.884C19 19.058 19 17.822 19 16V8c0-1.823 0-3.059-.235-3.942l.235.018c.975.096 1.631.313 2.121.803C22 5.757 22 7.17 22 9.999v4c0 2.83 0 4.243-.879 5.122c-.49.49-1.146.707-2.121.803z"
        opacity=".5"
      />
    </IconBase>
  );
}

/**
 * `solar:ssd-round-bold` — chave `database`.
 *
 * Solar não traz `database` no pacote. `server-path-broken` (o desenho de
 * servidor) está reservado ao item de menu **Conexões**: repeti-lo faria
 * um cabeçalho de card parecer um item de navegação. Fica o dispositivo
 * de armazenamento da própria coleção.
 */
export function DatabaseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M18.842 13.376c1.126 0 2.14.453 2.891 1.181l-2.365-9.379C18.842 3.545 17.9 3 16.737 3H7.263C6.1 3 5.158 3.545 4.632 5.178l-2.365 9.38a4.14 4.14 0 0 1 2.89-1.182z"
      />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M5.158 14.405c-1.167 0-2.2.663-2.75 1.674A3.4 3.4 0 0 0 2 17.703C2 19.552 3.442 21 5.158 21h13.684C20.558 21 22 19.552 22 17.703c0-.593-.15-1.146-.409-1.624c-.549-1.01-1.582-1.674-2.749-1.674zM11.21 17.4a.78.78 0 0 0-.789-.771a.78.78 0 0 0-.79.771v1.029a.78.78 0 0 0 .79.771a.78.78 0 0 0 .79-.771zm1.843-.771a.78.78 0 0 1 .79.771v1.029a.78.78 0 0 1-.79.771a.78.78 0 0 1-.79-.771V17.4a.78.78 0 0 1 .79-.771m3.42.771a.78.78 0 0 0-.789-.771a.78.78 0 0 0-.79.771v1.029a.78.78 0 0 0 .79.771a.78.78 0 0 0 .79-.771zm2.632 0a.78.78 0 0 0-.79-.771a.78.78 0 0 0-.789.771v1.029a.78.78 0 0 0 .79.771a.78.78 0 0 0 .79-.771z"
        clipRule="evenodd"
      />
    </IconBase>
  );
}
