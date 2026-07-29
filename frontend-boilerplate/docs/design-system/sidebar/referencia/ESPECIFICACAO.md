# Sidebar do AuditorIA — especificação para réplica

Documentação **autossuficiente** da navegação lateral, para reproduzir a mesma UI em outro
sistema (sem MUI). Não trata do **conteúdo** do menu — trata de **como ela é**: estrutura,
medidas, estados e comportamento.

> Todos os valores são finais (px, hex, ms). Onde o original usa `rem`, o px real já está
> convertido (a base do sistema é `html { font-size: 14px }`).
>
> Arquivos: `sidebar.css` (CSS puro, pronto para copiar) · `demo.html` (réplica funcional,
> roda offline — abra e compare lado a lado).

---

## 1. Visão geral

A sidebar tem **três formas**:

| Forma                 | Largura    | Quando                                                     |
| --------------------- | ---------- | ---------------------------------------------------------- |
| **Vertical** (padrão) | **300 px** | telas ≥ 1200 px                                            |
| **Mini** (colapsada)  | **88 px**  | usuário clica no botão de recolher                         |
| **Mobile** (gaveta)   | **288 px** | telas < 1200 px — vira um drawer temporário sobre a página |

Estrutura vertical, de cima para baixo:

```
┌──────────────────────────────┐ 300px
│  [logo 40×40]                │ ← padding: 20px topo · 28px esquerda · 8px base
│                              │
│  SUBHEADER DO GRUPO       ▾  │ ← rótulo clicável (colapsa o grupo)
│  ┌────────────────────────┐  │
│  │ ▣  Item raiz        ▸  │  │ ← 44px de altura mínima
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ ▣  Item raiz ativo     │  │ ← verde, fundo verde 8%
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ ▣  Item aberto      ▾  │  │
│  │  │╰ Sub-item           │  │ ← 36px, com "cotovelo" desenhado
│  │  │╰ Sub-item ativo     │  │
│  └────────────────────────┘  │
│                              │
│  OUTRO GRUPO              ▾  │
│  …                           │
└──────────────────────────────┘
       ⟲ botão de recolher (flutua na borda direita, na altura do header)
```

### O contêiner

| Propriedade          | Valor                                                             |
| -------------------- | ----------------------------------------------------------------- |
| Posição              | `fixed`, `top: 0`, `left: 0`, `height: 100%`                      |
| Largura              | `300px` (vertical) / `88px` (mini)                                |
| Fundo                | `#FFFFFF`                                                         |
| Borda direita        | `1px solid rgba(145, 158, 171, 0.12)`                             |
| Transição de largura | **`width 120ms linear`**                                          |
| `z-index`            | `1201` (acima do header, que é 1101)                              |
| Rolagem              | só a lista rola (o logo fica fixo); barra de rolagem fina/overlay |
| Lista                | `padding-left/right: 16px`; itens em coluna com **`gap: 4px`**    |

O conteúdo da página fica com `padding-left: 300px` (ou 88px na mini), com a **mesma
transição** `120ms linear` — sidebar e conteúdo deslizam juntos.

---

## 2. Anatomia do item raiz (nível 1)

```
┌─────────────────────────────────────────────┐
│ [ícone 24] Título................... [badge] [seta 16] │  min-height 44px
│            legenda opcional (caption)        │
└─────────────────────────────────────────────┘
```

| Parte                | Especificação                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| Caixa                | `min-height: 44px` · `padding: 4px 8px 4px 12px` · `border-radius: 8px` · largura 100%                 |
| Ícone                | **24 × 24 px**, `margin: 0 12px 0 0`, `flex-shrink: 0` — o SVG interno estica para 100%                |
| Título               | **12,25 px**, peso **500**, 1 linha com reticências (`line-clamp: 1`)                                  |
| Legenda (caption)    | **10,5 px**, cor `#919EAB`, 1 linha com reticências, abaixo do título; tooltip mostra o texto completo |
| Badge (info)         | **12 px**, peso **600**, `margin-left: 6px`, `line-height: 1.5`                                        |
| Seta (se tem filhos) | **16 × 16 px**, `margin-left: 6px` — chevron **direita** fechado ▸, **baixo** aberto ▾                 |
| Bloco de texto       | coluna flexível (`flex: 1 1 auto`) entre ícone e seta                                                  |

### Estados do item raiz

| Estado                                            | Texto         | Fundo                         | Peso                         |
| ------------------------------------------------- | ------------- | ----------------------------- | ---------------------------- |
| normal                                            | `#637381`     | transparente                  | 500                          |
| hover                                             | `#637381`     | `rgba(145, 158, 171, 0.08)`   | 500                          |
| **ativo** (rota atual)                            | **`#00A76F`** | **`rgba(0, 167, 111, 0.08)`** | **600**                      |
| ativo + hover                                     | `#00A76F`     | `rgba(0, 167, 111, 0.16)`     | 600                          |
| **aberto** (expandido, filho ativo em outra rota) | `#1C252E`     | `rgba(145, 158, 171, 0.08)`   | 500                          |
| desabilitado                                      | —             | —                             | `opacity: 0.48`, sem eventos |

> No tema escuro, o ativo usa `#5BE49B` (verde claro) no texto; os fundos não mudam.

---

## 3. Anatomia do sub-item (nível 2+)

```
item raiz aberto
   │ ← linha vertical 2px
   ╰─ [cotovelo] Sub-item          ← min-height 36px
   ╰─ [cotovelo] Sub-item ativo
```

| Parte                 | Especificação                                                                                                                                                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Caixa                 | `min-height: 36px`, mesmos paddings/raio do raiz                                                                                                                                                                                 |
| Recuo do bloco        | o contêiner dos filhos recebe `padding-left: 24px` (12 do padding + 12 de meio-ícone) e a lista interna mais `padding-left: 12px`                                                                                                |
| **Linha vertical**    | `2px` de largura, cor `#EDEFF2`, colada à esquerda do bloco, do topo até `calc(100% − 36px + 2px + 6px)` do fim (para no meio do último cotovelo)                                                                                |
| **Cotovelo (bullet)** | SVG de **12 × 12 px** — um traço curvo `M1 1v4a8 8 0 0 0 8 8h4` (desce e curva à direita), espessura 2, ponta arredondada, cor `#EDEFF2`; posicionado por `transform: translate(-12px, -4.8px)` a partir da esquerda do sub-item |
| Sem ícone             | sub-itens normalmente não têm ícone — só texto                                                                                                                                                                                   |

No tema escuro, linha e cotovelo usam `#282F37`.

### Estados do sub-item

| Estado                        | Texto     | Fundo                       | Peso    |
| ----------------------------- | --------- | --------------------------- | ------- |
| normal                        | `#637381` | transparente                | 500     |
| hover                         | `#637381` | `rgba(145, 158, 171, 0.08)` | 500     |
| **ativo**                     | `#1C252E` | `rgba(145, 158, 171, 0.08)` | **600** |
| aberto (tem netos expandidos) | `#1C252E` | `rgba(145, 158, 171, 0.08)` | 500     |

> Repare: o sub-item ativo **não fica verde** — fica escuro. Só o item **raiz** usa a cor
> da marca quando ativo.

### Expansão

Abrir/fechar é uma animação de **altura** (collapse). O grupo aberto ganha `gap: 4px`
entre os filhos, e o primeiro filho tem `margin-top: 4px`.

---

## 4. Subheader de grupo

O rótulo de seção ("VISÃO GERAL", "GERENCIAMENTO"…) é **clicável** e colapsa o grupo inteiro.

| Propriedade    | Valor                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Tipografia     | **9,625 px**, peso **700**, **CAIXA ALTA**, espaçamento normal                                                |
| Cor            | `#919EAB`                                                                                                     |
| Padding        | `16px 8px 8px 12px`                                                                                           |
| Cursor         | pointer; ocupa só a largura do texto (`align-self: flex-start`)                                               |
| Seta escondida | chevron **16 px** posicionado `left: -4px`, `opacity: 0`                                                      |
| **Hover**      | cor vira `#1C252E`, `padding-left` vai de 12 → **16 px** e a seta aparece (`opacity: 1`) — tudo em **300 ms** |
| Estado         | ▾ aberto / ▸ fechado; o conteúdo colapsa com animação de altura                                               |

Esse é um detalhe de assinatura da UI: o subheader "empurra para a direita" no hover
enquanto a seta surge à esquerda.

---

## 5. Botão de recolher (toggle)

Flutua **na borda direita da sidebar**, verticalmente centrado com o header:

| Propriedade  | Valor                                                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Posição      | `absolute`; `left: 300px` (ou `88px` na mini); `top: 36px` (metade do header de 72 px); `transform: translate(-50%, -50%)` |
| Tamanho      | ícone **16 px** dentro de um botão circular com `padding: 4px` (24 px de caixa)                                            |
| Fundo        | `#FFFFFF` · borda `1px solid rgba(145, 158, 171, 0.12)`                                                                    |
| Cor          | `#637381`; hover: texto `#1C252E` + fundo `#F4F6F8`                                                                        |
| Ícone        | chevron **esquerda** (aberta) / **direita** (mini)                                                                         |
| Transição    | `left 120ms linear` (acompanha a sidebar)                                                                                  |
| Visibilidade | só aparece ≥ 1200 px                                                                                                       |

---

## 6. Forma mini (88 px)

Cada item raiz vira um **bloco vertical compacto**:

```
┌────────┐
│  [22]  │  ← ícone 22px, margin 0 0 6px 0
│ Título │  ← 8,75px, peso 600 (700 se ativo), 1 linha
└────────┘  ← 56px de altura, padding 8px 4px 6px 4px, raio 8px
```

| Aspecto              | Valor                                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Item raiz            | `min-height: 56px`, coluna centrada, `padding: 8px 4px 6px 4px`, raio 8 px                                                                         |
| Ícone                | **22 × 22 px**                                                                                                                                     |
| Título               | **8,75 px**, peso 600; ativo → **700**                                                                                                             |
| Seta (se tem filhos) | 16 px, **absoluta**: `top: 11px`, `right: 6px`, apontando para a direita                                                                           |
| Lista                | `padding: 0 4px`, mesmo `gap: 4px`; logo centralizado (`padding: 20px 0`)                                                                          |
| Submenu              | **não expande para baixo** — abre um **painel flutuante** ao lado direito do item (dropdown), com os sub-itens no formato normal (36 px, 12,25 px) |
| Estados              | mesmas cores da forma vertical                                                                                                                     |
| Caption              | vira um ícone de "info" de 16 px, absoluto `top: 11px, left: 6px`                                                                                  |

O painel flutuante usa a mesma superfície de dropdown do sistema: fundo branco 90 % com
desfoque 20 px, raio 10 px, sombra `0 0 2px 0 rgba(145,158,171,0.24), -20px 20px 40px -4px
rgba(145,158,171,0.24)`, `padding: 4px`.

---

## 7. Forma mobile (< 1200 px)

- A sidebar fixa **desaparece**; o header ganha um **botão de menu** (☰).
- O menu abre como **gaveta temporária** de **288 px** sobre um fundo escurecido
  `rgba(28, 37, 46, 0.48)`.
- O conteúdo interno é **idêntico** à forma vertical (mesmos itens, medidas e estados).
- A superfície da gaveta tem o mesmo tratamento de dropdown (fundo 90 % + desfoque) e
  sombra direcional `40px 40px 80px -8px rgba(145, 158, 171, 0.24)`.

---

## 8. Ícones do menu

Duas origens convivem:

| Origem                | Como funciona                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| **Iconify** (maioria) | `<Icon icon="solar:...">` — coleção **Solar**, variações `-bold-duotone`, `-broken`, `-line-duotone` |
| **SVG próprio**       | arquivos em `assets/icons/navbar/ic-*.svg`, pintados via **CSS mask** com `currentColor`             |

Regra prática para réplica: **todo ícone herda a cor do texto do item** (`currentColor`).
Use ícones de traço/duotone na grade 24×24. O pacote de ícones já entregue
(`icones-auditoria.zip`) contém os SVGs reais — os do menu estão lá.

---

## 9. Tokens usados (resumo)

| Token                                       | Valor                                                                   |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| Largura vertical / mini / mobile            | `300px` / `88px` / `288px`                                              |
| Altura item raiz / sub / mini               | `44px` / `36px` / `56px`                                                |
| Raio do item                                | `8px`                                                                   |
| Gap entre itens                             | `4px`                                                                   |
| Padding do item                             | `4px 8px 4px 12px`                                                      |
| Ícone raiz / mini / seta                    | `24px` / `22px` / `16px`                                                |
| Bullet (cotovelo)                           | `12px`, traço 2, `#EDEFF2` (claro) / `#282F37` (escuro)                 |
| Título / caption / subheader / mini         | `12,25px` / `10,5px` / `9,625px` / `8,75px`                             |
| Cor normal / ativa raiz / ativa sub         | `#637381` / `#00A76F` / `#1C252E`                                       |
| Fundo hover / ativo raiz / ativo raiz hover | `rgba(145,158,171,.08)` / `rgba(0,167,111,.08)` / `rgba(0,167,111,.16)` |
| Borda da sidebar                            | `1px solid rgba(145,158,171,0.12)`                                      |
| Transição de largura                        | `120ms linear`                                                          |
| Transição do subheader                      | `300ms`                                                                 |

---

## 10. Origem (rastreabilidade)

| O quê                                              | Arquivo                                                                                        |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Variáveis da nav (medidas/cores)                   | `frontend/src/components/nav-section/styles/css-vars.ts:9-105`                                 |
| Item vertical (anatomia + estados + bullet)        | `frontend/src/components/nav-section/vertical/nav-item.tsx:157-280`                            |
| Linha vertical + recuo dos filhos                  | `frontend/src/components/nav-section/components/nav-collapse.tsx:10-40`                        |
| Subheader (hover com seta)                         | `frontend/src/components/nav-section/components/nav-subheader.tsx:29-55`                       |
| Estilos compartilhados (ícone, título, seta, info) | `frontend/src/components/nav-section/styles/nav-item-styles.ts:16-58`                          |
| Item mini                                          | `frontend/src/components/nav-section/mini/nav-item.tsx:150-240`                                |
| Contêiner (fixed, borda, transição)                | `frontend/src/layouts/dashboard/nav-vertical.tsx:110-133`                                      |
| Botão de recolher                                  | `frontend/src/layouts/components/nav-toggle-button.tsx:16-53`                                  |
| Larguras e transição do layout                     | `frontend/src/layouts/dashboard/css-vars.ts:10-14` + `frontend/src/layouts/core/css-vars.ts:8` |
| Gaveta mobile                                      | `frontend/src/layouts/dashboard/nav-mobile.tsx:48-63`                                          |
| Ícones do menu                                     | `frontend/src/layouts/nav-config-dashboard.tsx:48-90`                                          |
| Expansão ao navegar                                | `frontend/src/components/nav-section/vertical/nav-list.tsx:30-41`                              |
