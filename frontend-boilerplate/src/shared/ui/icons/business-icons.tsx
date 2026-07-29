/**
 * Ícones semânticos de NEGÓCIO/FISCAL (dinheiro, tributo, contribuinte,
 * documento, meta). Consumidos por `../semantic-icons.ts`.
 */

import type { SVGProps } from 'react';

import { IconBase } from './icon-base';

/**
 * `solar:dollar-minimalistic-bold-duotone` — chave `money`.
 */
export function MoneyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2s10 4.477 10 10"
        clipRule="evenodd"
        opacity=".5"
      />
      <path
        fill="currentColor"
        d="M12.75 6a.75.75 0 0 0-1.5 0v.317c-1.63.292-3 1.517-3 3.183c0 1.917 1.813 3.25 3.75 3.25c1.377 0 2.25.906 2.25 1.75s-.873 1.75-2.25 1.75c-1.376 0-2.25-.906-2.25-1.75a.75.75 0 0 0-1.5 0c0 1.666 1.37 2.891 3 3.183V18a.75.75 0 0 0 1.5 0v-.317c1.63-.292 3-1.517 3-3.183c0-1.917-1.813-3.25-3.75-3.25c-1.376 0-2.25-.906-2.25-1.75s.874-1.75 2.25-1.75c1.377 0 2.25.906 2.25 1.75a.75.75 0 0 0 1.5 0c0-1.666-1.37-2.891-3-3.183z"
      />
    </IconBase>
  );
}

/**
 * `solar:bill-list-bold-duotone` — chave `tax` (nota com itens).
 */
export function TaxIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M7.245 2h9.51c1.159 0 1.738 0 2.206.163a3.05 3.05 0 0 1 1.881 1.936C21 4.581 21 5.177 21 6.37v14.004c0 .858-.985 1.314-1.608.744a.946.946 0 0 0-1.284 0l-.483.442a1.657 1.657 0 0 1-2.25 0a1.657 1.657 0 0 0-2.25 0a1.657 1.657 0 0 1-2.25 0a1.657 1.657 0 0 0-2.25 0a1.657 1.657 0 0 1-2.25 0l-.483-.442a.946.946 0 0 0-1.284 0c-.623.57-1.608.114-1.608-.744V6.37c0-1.193 0-1.79.158-2.27c.3-.913.995-1.629 1.881-1.937C5.507 2 6.086 2 7.245 2"
        opacity="0.4"
      />
      <path
        fill="currentColor"
        d="M7 6.75a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5zm3.5 0a.75.75 0 0 0 0 1.5H17a.75.75 0 0 0 0-1.5zM7 10.25a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5zm3.5 0a.75.75 0 0 0 0 1.5H17a.75.75 0 0 0 0-1.5zM7 13.75a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5zm3.5 0a.75.75 0 0 0 0 1.5H17a.75.75 0 0 0 0-1.5z"
      />
    </IconBase>
  );
}

/**
 * `solar:sale-bold-duotone` — chave `percent`.
 *
 * `solar:percent-bold-duotone` **não existe** na coleção — é um dos 4
 * ícones quebrados do catálogo do pacote (§3 de `ICONES.md`), e
 * `sale-bold-duotone` é o substituto oficial: o selo com o símbolo %.
 * O arquivo veio de `svg-substitutos/`.
 */
export function PercentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M9.592 3.2a6 6 0 0 1-.495.399c-.298.2-.633.338-.985.408c-.153.03-.313.043-.632.068c-.801.064-1.202.096-1.536.214a2.71 2.71 0 0 0-1.655 1.655c-.118.334-.15.735-.214 1.536a6 6 0 0 1-.068.632c-.07.352-.208.687-.408.985c-.087.13-.191.252-.399.495c-.521.612-.782.918-.935 1.238c-.353.74-.353 1.6 0 2.34c.153.32.414.626.935 1.238c.208.243.312.365.399.495c.2.298.338.633.408.985c.03.153.043.313.068.632c.064.801.096 1.202.214 1.536a2.71 2.71 0 0 0 1.655 1.655c.334.118.735.15 1.536.214c.319.025.479.038.632.068c.352.07.687.209.985.408c.13.087.252.191.495.399c.612.521.918.782 1.238.935c.74.353 1.6.353 2.34 0c.32-.153.626-.414 1.238-.935c.243-.208.365-.312.495-.399c.298-.2.633-.338.985-.408c.153-.03.313-.043.632-.068c.801-.064 1.202-.096 1.536-.214a2.71 2.71 0 0 0 1.655-1.655c.118-.334.15-.735.214-1.536c.025-.319.038-.479.068-.632c.07-.352.209-.687.408-.985c.087-.13.191-.252.399-.495c.521-.612.782-.918.935-1.238c.353-.74.353-1.6 0-2.34c-.153-.32-.414-.626-.935-1.238a6 6 0 0 1-.399-.495a2.7 2.7 0 0 1-.408-.985a6 6 0 0 1-.068-.632c-.064-.801-.096-1.202-.214-1.536a2.71 2.71 0 0 0-1.655-1.655c-.334-.118-.735-.15-1.536-.214a6 6 0 0 1-.632-.068a2.7 2.7 0 0 1-.985-.408a6 6 0 0 1-.495-.399c-.612-.521-.918-.782-1.238-.935a2.71 2.71 0 0 0-2.34 0c-.32.153-.626.414-1.238.935"
        opacity=".5"
      />
      <path
        fill="currentColor"
        d="M15.83 8.17a.814.814 0 0 1 0 1.151l-6.51 6.51a.814.814 0 0 1-1.151-1.15l6.51-6.511a.814.814 0 0 1 1.152 0m-.033 6.544a1.085 1.085 0 1 1-2.17 0a1.085 1.085 0 0 1 2.17 0m-6.511-4.341a1.085 1.085 0 1 0 0-2.17a1.085 1.085 0 0 0 0 2.17"
      />
    </IconBase>
  );
}

/**
 * `solar:case-minimalistic-bold` — chave `building`.
 *
 * Solar não traz prédio no pacote. A maleta é o desenho de
 * "empresa/estabelecimento" da coleção — que é o que `building` significa
 * no vocabulário fiscal (o contribuinte pessoa jurídica).
 */
export function BuildingIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M2.162 8.5C2 9.603 2 11.05 2 13c0 3.771 0 5.657 1.172 6.828S6.229 21 10 21h4c3.771 0 5.657 0 6.828-1.172S22 16.771 22 13c0-1.95 0-3.396-.162-4.5c-2.277 1.48-3.736 2.424-5.088 3.005V12a.75.75 0 0 1-1.5.017a12.75 12.75 0 0 1-6.5 0A.75.75 0 0 1 7.25 12v-.495C5.898 10.923 4.44 9.98 2.162 8.5"
      />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M10.581 2.25h-.02c-.114 0-.202 0-.286.005a2.75 2.75 0 0 0-2.385 1.72a8 8 0 0 0-.12.343l-.004.012a1.63 1.63 0 0 1-.504.695q-.341.011-.653.03c-1.644.096-2.687.366-3.437 1.117a3 3 0 0 0-.592.838q.087.03.167.081c2.1 1.365 3.42 2.22 4.517 2.767A.75.75 0 0 1 8.75 10v.458c2.12.64 4.38.64 6.5 0V10a.75.75 0 0 1 1.487-.142c1.096-.548 2.416-1.402 4.516-2.767a.8.8 0 0 1 .167-.081a3 3 0 0 0-.592-.838c-.75-.75-1.793-1.02-3.437-1.118q-.296-.016-.618-.028l-.04-.034a1.9 1.9 0 0 1-.525-.74l-.003-.009c-.036-.107-.063-.191-.095-.269a2.75 2.75 0 0 0-2.385-1.719a5 5 0 0 0-.285-.005zm4.237 2.566l-.005-.011l-.005-.012l-.004-.012l-.004-.01l-.002-.005l-.004-.012l-.004-.012l-.002-.006l-.003-.008l-.002-.007l-.002-.006a4 4 0 0 0-.062-.181a1.25 1.25 0 0 0-1.085-.782a4 4 0 0 0-.215-.002h-2.838c-.143 0-.183 0-.215.002a1.25 1.25 0 0 0-1.084.782l-.003.007l-.008.021a6 6 0 0 0-.077.23l-.002.006l-.003.007l-.002.008l-.002.006l-.004.012l-.004.012l-.002.005l-.004.01l-.004.012l-.005.012l-.004.01l-.001.001l-.044.108L10 5h4.896a3 3 0 0 1-.078-.184"
        clipRule="evenodd"
      />
    </IconBase>
  );
}

/**
 * `solar:users-group-rounded-bold-duotone` — chave `users`.
 *
 * Duotone, e não a variante `broken` do item de menu **Usuários**: são
 * papéis diferentes (conteúdo × navegação) e o contraste evita que um
 * cabeçalho de card seja lido como item do menu.
 */
export function UsersGroupIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="15" cy="6" r="3" fill="currentColor" opacity="0.4" />
      <ellipse cx="16" cy="17" fill="currentColor" opacity="0.4" rx="5" ry="3" />
      <circle cx="9.001" cy="6" r="4" fill="currentColor" />
      <ellipse cx="9.001" cy="17.001" fill="currentColor" rx="7" ry="4" />
    </IconBase>
  );
}

/**
 * `solar:document-bold-duotone` — chave `document`.
 */
export function DocumentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M3 10c0-3.771 0-5.657 1.172-6.828S7.229 2 11 2h2c3.771 0 5.657 0 6.828 1.172S21 6.229 21 10v4c0 3.771 0 5.657-1.172 6.828S16.771 22 13 22h-2c-3.771 0-5.657 0-6.828-1.172S3 17.771 3 14z"
        opacity=".5"
      />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M7.25 10A.75.75 0 0 1 8 9.25h8a.75.75 0 0 1 0 1.5H8a.75.75 0 0 1-.75-.75m0 4a.75.75 0 0 1 .75-.75h5a.75.75 0 0 1 0 1.5H8a.75.75 0 0 1-.75-.75"
        clipRule="evenodd"
      />
    </IconBase>
  );
}

/**
 * `solar:flag-bold` — chave `target`.
 *
 * Solar não traz alvo/mira no pacote; a bandeira é o desenho de META da
 * coleção.
 */
export function TargetIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M5.75 1a.75.75 0 0 1 .75.75V3.6l1.72-.344a8.7 8.7 0 0 1 4.925.452l.204.081a8 8 0 0 0 4.91.334a1.2 1.2 0 0 1 1.491 1.164v7.367c0 .644-.439 1.206-1.064 1.362l-.214.053a8.68 8.68 0 0 1-5.327-.361a8.7 8.7 0 0 0-4.924-.452L6.5 13.6v8.15a.75.75 0 0 1-1.5 0v-20A.75.75 0 0 1 5.75 1"
      />
    </IconBase>
  );
}
