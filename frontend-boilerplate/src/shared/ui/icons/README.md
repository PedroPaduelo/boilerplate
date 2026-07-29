# Ícones

Os ícones **reais** do sistema AuditorIA, como componentes React — não uma
biblioteca genérica escolhida por conveniência.

## De onde vieram

Do pacote `icones-auditoria` entregue pelo usuário e catalogado em
[`docs/design-system/sidebar/referencia/ICONES.md`](../../../../docs/design-system/sidebar/referencia/ICONES.md):
387 SVGs extraídos do sistema em produção, coleções **`solar`** (vocabulário
visual dominante — 194 dos 387) e **`eva`** (setas e ações), grade **24×24**,
`fill`/`stroke` em `currentColor`.

Cada componente daqui é uma **cópia literal** do `path` do SVG de origem. Nada
foi redesenhado, simplificado ou "melhorado": um traço 1px diferente já é outro
ícone, e a razão de existir deste módulo é justamente parar de usar um ícone
_parecido_.

Três arquivos são a fonte da verdade do que entrou aqui:

| Documento                                                                                     | O que fixa                                                         |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [`sidebar/CONTRATO.md` §6](../../../../docs/design-system/sidebar/CONTRATO.md)                | os 7 ícones do menu e os 4 de apoio da navegação — nome por nome   |
| [`sidebar/referencia/ICONES.md`](../../../../docs/design-system/sidebar/referencia/ICONES.md) | o catálogo, os 4 ícones quebrados e seus substitutos               |
| [`06-icones.md`](../../../../docs/design-system/06-icones.md)                                 | como os ícones se comportam no sistema (tamanho, cor, alinhamento) |

## Por que offline (SVG inline, nada de rede)

Porque o original **pisca**. A doc do pacote (§4 de `ICONES.md`) mede: dos 387
ícones que o sistema usa, só **224 estão registrados offline** — os outros
**163 são buscados na internet a cada carga**. O próprio código de origem avisa
disso em `console.warn`:

> _Icon "…" is currently loaded online, which may cause flickering effects.
> To ensure a smoother experience, please register your icon collection for
> offline use._

Os efeitos práticos estão registrados lá: piscada ao carregar, ícone ausente sem
internet e diferença visual entre ambientes — "é a explicação mais provável para
'os ícones estão diferentes'".

Aqui não existe esse modo de falhar: o traçado é parte do bundle, entra no
primeiro paint e não depende de rede, de CDN nem de um pacote npm de terceiro
que possa mudar de desenho numa atualização menor.

## Como usar

```tsx
import { Icon } from '@astryxdesign/core';
import { HomeIcon, semanticIcon } from '@/shared/ui';

<Icon icon={HomeIcon} size="lg" color="accent" />; // pelo componente
<Icon icon={semanticIcon('money')} />; //             pelo nome semântico
```

Os componentes **não fixam `width`/`height`** — quem dimensiona é o consumidor
(o `Icon` do Astryx aplica `1.25rem`/`1.5rem`; o CSS da navegação aplica 24px na
forma normal e 22px na mini). Por padrão são `aria-hidden="true"` e
`focusable="false"`: ícone é decoração ao lado de um rótulo. Passe `label` ao
`Icon` (ou `aria-label`/`role="img"` direto) quando o ícone for a **única**
informação — o `IconBase` detecta e remove o `aria-hidden` sozinho.

## Como acrescentar um ícone

1. **Ache o SVG no pacote**, em `uploads/icones-ref/icones/svg/`, no formato
   `colecao__nome.svg` (ex.: `solar__wallet-bold.svg`). Se o nome estiver na
   lista de quebrados (§3 de `ICONES.md`), use o arquivo de `svg-substitutos/`.
   Prefira as variantes que a origem usa: `-bold-duotone`, `-line-duotone`,
   `-broken`.
2. **Escolha o arquivo de destino** por família — `nav-icons` (menu),
   `arrow-icons` (setas), `chart-icons` (visualização), `data-icons` (estrutura
   de dados), `business-icons` (fiscal), `status-icons` (estado/contexto) — ou
   crie um novo. Regra dura: **nenhum arquivo passa de ~200 linhas**; foi por
   isso que visualização e estrutura de dados viraram dois arquivos.
3. **Escreva o componente** copiando o conteúdo do `<svg>` (só os filhos) e
   convertendo os atributos para JSX: `fill-rule` → `fillRule`, `clip-rule` →
   `clipRule`, `stroke-width` → `strokeWidth`, `stroke-linecap` →
   `strokeLinecap`, `stroke-linejoin` → `strokeLinejoin`. O resto passa igual.

   ```tsx
   /** `solar:wallet-bold` — chave `wallet`. */
   export function WalletIcon(props: SVGProps<SVGSVGElement>) {
     return (
       <IconBase {...props}>
         <path fill="currentColor" d="…" />
       </IconBase>
     );
   }
   ```

   Nunca escreva `<svg>` à mão: `IconBase` é quem garante `viewBox`, `xmlns` e
   as regras de acessibilidade iguais para todos.

4. **Exporte no `index.ts`**, no grupo correspondente.
5. Se o ícone entra no vocabulário semântico, **registre a chave** em
   `../semantic-icons.ts`. E se a coleção Solar não tiver equivalente para o
   significado, **escreva no JSDoc o que foi usado no lugar e por quê** — é o
   que impede a próxima pessoa de refazer a mesma pesquisa (ou de trocar por um
   desenho pior sem saber que a opção óbvia não existe).
