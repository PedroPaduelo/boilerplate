# Editor de dashboard — canvas + inspetor

`/dashboards/:id/edit`. Esta nota registra as decisões do redesenho e,
principalmente, **onde mora cada regra** — para que a próxima mudança não
reintroduza o que foi corrigido.

Pesquisa e referências: [`docs/research/dashboard-editor-references.md`](../../../docs/research/dashboard-editor-references.md).

---

## O desenho

```
┌──────────────────────────────────────────────────────────────┐
│ barra de ações (sticky)   [Rascunho] estado · Salvar Publicar│
├───────────────────────────────────────┬──────────────────────┤
│ CANVAS                                │ INSPETOR (400px,     │
│ o dashboard REAL, editável no lugar   │ sticky)              │
│                                       │                      │
│ [aba: Visão geral | Detalhamento]     │ o que está           │
│ Linha 1 · 4 blocos · altura compacta  │ selecionado:         │
│  ┌────┐┌────┐┌────┐┌────┐             │ dashboard / linha /  │
│  │KPI ││KPI ││KPI ││KPI │             │ bloco                │
│  └────┘└────┘└────┘└────┘             │                      │
└───────────────────────────────────────┴──────────────────────┘
```

**Uma coisa selecionada por vez.** O inspetor tem três conteúdos possíveis
(`inspector-dashboard`, `inspector-row`, `inspector-block`) e a seleção vive em
`use-editor-selection.ts` — resolvida **contra o layout atual**, para nunca
apontar para um bloco que acabou de ser removido.

**O canvas é o renderer de produção.** `CanvasRow` usa o `BlockGrid` do
render-engine e `CanvasBlock` usa o `BlockRenderer`. Não existe uma "grade do
editor": se existisse, ela divergiria da real — que foi exatamente o defeito da
versão anterior (o preview em 792px mostrava 2 colunas onde a tela publicada
mostra 3).

---

## Altura

A altura é uma propriedade da **linha**; do bloco é exceção.

| Onde    | Campo          | Efeito                                                  |
| ------- | -------------- | ------------------------------------------------------- |
| Linha   | `row.height`   | vale para todas as células da linha                     |
| Bloco   | `block.height` | sobrepõe a da linha, só naquele bloco                   |
| Ausente | —              | o motor deriva do tipo dos blocos (`rowHeightForTypes`) |

Dois formatos, na ordem de preferência:

1. **degrau nomeado** — `auto` · `compact` (160px) · `default` (440px) ·
   `tall` (500px). É uma referência à calibragem medida do motor
   (`shared/render-engine/lib/block-sizing.ts`): recalibrar as medidas move
   todos os dashboards que usam o degrau;
2. **pixels** — 120 a 1600. Escape para quem olhou a tela e decidiu outra coisa.
   Grampeado **na escrita** (`normalizeHeight`), para que ninguém receba um
   "layout inválido" por ter digitado 4000.

Ordem de quem decide, em `BlockGrid`: **bloco → linha → derivação**.

Contrato: `$defs.blockHeight` em
`shared/contracts/src/schemas/dashboard-layout.schema.ts`. O agente também
recebe a instrução (descrição de `rows` em `modules/mcp/tools/dashboards.ts`) —
com o pedido explícito de **omitir** `height` quando não houver motivo.

---

## Largura

O `BlockGrid` roda em `itemSizing: 'equal'` em **todas** as telas do produto:
blocos que dividem a linha recebem faixas iguais, e a única leitura de `span`
que sobra é `span >= 12` = "linha inteira".

Por isso o editor **não** oferece mais um campo "Largura (1–12)": ele existia,
aceitava 7 e 5, e não produzia 58%/42% — não produzia nada. O controle atual
("Divide a linha" / "Linha inteira") é o que o motor realmente lê, e continua
gravando `span` no contrato (`editor-fields.ts`).

---

## O defeito que não pode voltar

`sanitizeLayoutForSave` **reconstrói o bloco campo a campo**. Enquanto ele não
conhecia `title`, `subtitle`, `rowSpan` e `blocks`, abrir um dashboard montado
pelo agente e clicar em Salvar apagava o título dos cards e o conteúdo das
seções — sem erro e sem aviso.

**Regra:** todo campo que `normalizeLayout` lê, `sanitizeBlock` escreve. Há
teste de idempotência (`normalize → sanitize` devolve o mesmo objeto) em
`lib/layout-editor.test.ts`; ele é a rede que segura isso.

---

## Onde mexer

| Quero…                              | Arquivo                                                   |
| ----------------------------------- | --------------------------------------------------------- |
| mudar a composição das duas regiões | `src/app/index.css` (`.app-editor-shell`)                 |
| mudar o que o inspetor mostra       | `editor/inspector-*.tsx`                                  |
| mudar as ações de um bloco          | `editor/block-actions.tsx`                                |
| mudar a política de altura/colunas  | `shared/render-engine/lib/block-sizing.ts`                |
| acrescentar um campo do contrato    | contrato → `normalizeLayout` → `sanitizeBlock` → inspetor |
