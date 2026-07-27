# Design System — AuditorIA sobre Astryx (XDS)

O design system aplicado neste app é o do **AuditorIA** (originalmente MUI 7.0.1 /
Minimal Kit v7), portado para o Astryx. Não foi um "inspirado em": os valores
vêm da auditoria do frontend original — leitura de código + tema computado em
Node + medição em runtime no Chrome, com 2.340 citações `arquivo:linha`.

A ficha completa está em [`docs/design-system/`](../../../../docs/design-system/).

---

## A regra que sustenta tudo

> **Nenhum valor de design é digitado no código da aplicação.**

Cor, tamanho, raio, sombra, duração — tudo sai de token. Se você está prestes a
escrever `#00A76F`, `12px` ou `200ms` num componente, pare: ou o token existe,
ou ele precisa nascer no JSON de origem.

---

## Como o tema é montado

```
ds-tokens.source.json          ← FONTE DA VERDADE (a auditoria, intocada)
        │
        │  node scripts/generate-ds-theme.mjs      (npm run ds:tokens)
        ▼
tokens.generated.ts            ← 333 tokens + rastreabilidade (GERADO)
typography-responsive.css      ← media queries de h1–h6 (GERADO)
        │
        │  auditoria-theme.ts  → liga os tokens aos slots do Astryx
        │  component-overrides.ts → traduz as fichas de componente
        ▼
        │  astryx theme build                       (npm run ds:build)
        ▼
auditoria.css + auditoria.js   ← CSS compilado (GERADO)
```

**Três arquivos são gerados e não devem ser editados à mão**:
`tokens.generated.ts`, `typography-responsive.css`, `auditoria.css`/`.js`/`.d.ts`.
Eles estão fora do Prettier e do ESLint (`.prettierignore`) de propósito — o
formatador reescrevia o gerado, ele divergia do gerador e a validação seguinte
acusava dessincronia.

### Comandos

| Comando             | O que faz                           |
| ------------------- | ----------------------------------- |
| `npm run ds:tokens` | regenera os tokens a partir do JSON |
| `npm run ds:build`  | regenera + compila o CSS do tema    |
| `npm run ds:check`  | **valida** (rode antes de commitar) |

---

## As duas camadas de token

**1. `--ds-*` — a paleta bruta do DS.** Tudo que a auditoria registrou: os 6 tons
de cada família (`lighter`→`darker`), os 10 cinzas, os overlays de ação, as 16
`customShadows`, as dimensões do chrome, os tamanhos de controle.

**2. `--color-*`, `--radius-*`, `--text-*`… — os slots do Astryx**, que apenas
_apontam_ para a camada 1:

```css
--color-accent: var(--ds-color-primary-main);
```

Por que duas camadas: o Astryx tem ~172 slots semânticos e o DS tem tons sem
equivalente (a variante `soft` precisa de `lighter`/`darker`). Assim nada se
perde e cada cor tem **uma** fonte. Trocar `--ds-color-primary-main` muda o
botão, o link, a sombra colorida e o gráfico de uma vez.

### Compondo transparência

O DS compõe transparência a partir do canal RGB, e nós também:

```ts
rgba(var(--ds-channel-primary-main) / 0.16)   // fundo da variante `soft`
```

Por isso cada cor publica também `--ds-channel-*`.

---

## Coisas do DS que surpreendem (e são de propósito)

| Fato                                                                     | Onde                     |
| ------------------------------------------------------------------------ | ------------------------ |
| A borda do campo em **foco** é `text.primary`, não a cor da marca        | `08-…​.md` §4.2          |
| Botão tem `text-transform: unset` — a lib de origem usa `uppercase`      | `02-…​.md` §3.2          |
| Sombras **não são pretas**: a escala inteira tem base `#919EAB` no claro | `08-…​.md` §2            |
| `border-radius` base é **8px**, não 4px                                  | `10-tokens.json` `shape` |
| Título de **página** é `h4` (21px); título de **card** é `h6`            | `02-…​.md` §5            |
| Divisória de célula de tabela é **tracejada**                            | `tabela.md`              |
| Seleção de item de menu é **neutra**, não colorida                       | `menu-…​.md`             |
| As famílias semânticas são **idênticas** nos dois esquemas               | `01-cores.md` §5         |

## Onde divergimos da origem — e por quê

Três decisões conscientes, todas registradas:

1. **Base do `rem`.** A origem tem `html { font-size: 14px }` com os `rem`
   gerados sobre 16 — todo `rem` renderiza a 87,5% (a própria auditoria chama
   isso de inconsistência, §1). Reproduzimos o **resultado**: os tokens saem em
   **px real medido**. A tela fica idêntica, sem contaminar as utilities do
   Tailwind (que são em `rem`) com uma raiz de 14px.

2. **Anel de foco.** A origem não tem `:focus-visible` em lugar nenhum — falha
   de WCAG 2.4.7 que a auditoria lista como "precisa de decisão humana" (§5).
   Adicionamos, usando só o que o DS já tem (cor de acento + 2px da escala).

3. **Cabeçalho de tabela.** Na origem ele é 14px contra 12,25px do corpo — a
   auditoria mostra que é efeito colateral do item 1, não intenção (§4).
   Alinhamos ao corpo.

E uma lacuna preenchida por fora: **fonte monoespaçada**, que o DS não define
porque o produto original não tem editor de SQL. Este tem.

---

## Mudando alguma coisa

**Um valor de design** → edite `ds-tokens.source.json`, rode `npm run ds:build`.

**Um componente** → `component-overrides.ts`, usando token existente. Se o token
não existe, ele nasce no JSON primeiro.

**Nunca** → `#hex`/`px` num `.tsx`, ou editar arquivo gerado.

O `npm run ds:check` reprova: referência a token inexistente (em CSS, `var()`
quebrado **falha em silêncio**), valor hardcoded na camada de ligação,
`light-dark()` com mais de 2 argumentos (mata sombra multi-camada sem avisar) e
override apontando para componente/prop que não existe no Astryx.
