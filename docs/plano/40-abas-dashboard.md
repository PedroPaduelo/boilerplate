# 40 — Abas no dashboard (viabilidade + caminho escolhido)

> Documento de decisão. Escrito ANTES da implementação, a pedido do usuário
> ("PRIMEIRO avalie a viabilidade e me reporte o caminho").

## 1. Veredito

**Viável, sem migração de banco e sem quebrar nenhum dashboard salvo.**
O caminho escolhido difere da sugestão original em UM ponto importante — e é
essa diferença que torna a mudança barata e segura.

## 2. A sugestão original e por que ela foi descartada

A sugestão era `tabs?: Tab[]` onde cada `Tab` **contém** suas `rows`:

```ts
interface Tab { id: string; title: string; rows: Row[] }   // ❌ descartado
```

O problema é que `rows` deixa de ser o único lugar onde moram os blocos. Todo
código que hoje percorre `layout.rows` passa a enxergar apenas os blocos da
"aba implícita" e fica **cego** para os blocos dentro de `tabs`. Levantamento
dos consumidores reais de `layout.rows` no backend:

| Arquivo | O que faz | Quebra se `rows` mudar de lugar? |
|---|---|---|
| `modules/data/block-resolver.ts` (`resolveBlocks`) | resolve `dataBinding`/`chartId` de cada bloco | **Sim** — blocos de aba nunca receberiam dados |
| `modules/dashboards/service.ts` (`collectChartRefs`) | valida `props.chartId` no save | **Sim** — referência inválida passaria batido |
| `modules/dashboards/service.ts` (`injectChartTitles`) | injeta título do Chart no header | **Sim** — headers com nome genérico |
| `modules/dashboards/service.ts` (`materializePublishedDataPayload`) | snapshot do publish p/ link público | **Sim** — link público sem dados nas abas |
| `modules/mcp/tools/dashboards.ts` | schema/descrição das tools do agente | Sim (contrato descrito à IA) |
| `modules/agent/tools/mcp-adapter.ts` | coerção de layout vindo da IA | Sim |
| `frontend/.../lib/dashboard-filters.ts` (`blocksAffectedByFilter`) | quais blocos escutam um filtro | Sim |

São **7 pontos de travessia**, três deles (`modules/data/**`, `modules/mcp/**`,
`modules/agent/**`) **fora do meu ownership** neste trabalho. Cada ponto
esquecido vira uma falha *silenciosa* (bloco renderiza vazio, sem erro).

## 3. Caminho escolhido: aba como PROJEÇÃO sobre `rows`

```ts
interface Tab { id: string; title: string; rowIds: string[] }   // ✅ escolhido

interface DashboardLayout {
  filters: Filter[];
  rows: Row[];      // continua sendo a lista CANÔNICA e COMPLETA de linhas
  tabs?: Tab[];     // OPCIONAL — agrupa/ordena as linhas em abas
}
```

`rows` continua sendo o único container de blocos; `tabs` só diz **quais linhas
aparecem em qual aba e em que ordem**. Consequências:

- os 7 consumidores acima **não mudam uma linha** e continuam enxergando 100%
  dos blocos (inclusive os de abas) — dados, publish, PDF, MCP e agente seguem
  corretos "de graça";
- retrocompatibilidade fica simétrica e trivial (§4);
- o custo é precisar de um **normalizador** para linhas órfãs e `rowIds`
  inválidos — resolvido por uma função pura única (§5).

## 4. Retrocompatibilidade

Três garantias, em camadas:

1. **`tabs` é opcional no JSON Schema** (`DashboardLayoutSchema`) — não entra em
   `required`. Layout antigo `{ filters, rows }` continua válido.
2. **Nenhum dado sujo é possível.** O schema tem `additionalProperties: false`,
   ou seja *hoje* um layout com `tabs` é **rejeitado**. Logo nenhuma linha do
   banco pode ter `tabs` hoje: a mudança só abre a porta, não precisa limpar
   nada atrás.
3. **Leitura**: layout sem `tabs` é lido como **uma aba implícita contendo todas
   as `rows`** — exatamente o comportamento atual.

**Nenhuma migração Prisma.** `draft_layout`/`published_layout` são colunas
`Json`; acrescentar uma chave dentro do JSON não altera o schema do banco.

## 5. Invariante do normalizador: nenhum bloco fica invisível

`resolveDashboardTabs(layout)` é a fonte única da verdade (compartilhada BE/FE):

| Situação | Regra |
|---|---|
| sem `tabs` / `tabs: []` | 1 aba implícita com **todas** as `rows`, na ordem original |
| `rowIds` aponta p/ linha inexistente | ignora o id (não cria linha fantasma) |
| mesmo `rowId` em duas abas | primeira ocorrência vence (linha nunca duplica) |
| linha **órfã** (em `rows`, em nenhuma aba) | anexada à **primeira** aba |

A última regra é o que sustenta o invariante **"a união das linhas de todas as
abas === `layout.rows`"** — testado explicitamente. Sem ela, salvar pelo agente
(que não conhece abas) esconderia conteúdo sem erro.

## 6. O que muda no backend

- **Zod (`modules/dashboards/schema.ts`)**: `layoutInputSchema` ganha
  `tabs: z.array(z.any()).optional()`. **Obrigatório**: `z.object()` do Zod v3
  faz *strip* de chaves desconhecidas por padrão — sem esse campo, o `tabs`
  enviado pelo FE seria descartado silenciosamente antes de chegar ao service.
- **`addChartToDashboard`**: passa a preservar `tabs` (hoje reconstrói
  `{ filters, rows }` e perderia as abas) e, quando cria uma linha nova num
  layout com abas, registra a linha na primeira aba.
- **Validação de conteúdo**: continua sendo o contrato compartilhado (ajv), que
  agora conhece `tabs`. Nada de validação nova espalhada.
- **Migração Prisma**: nenhuma.

## 7. O editor precisa acompanhar? Sim — em dois níveis

**Nível 1 (obrigatório, é bug de perda de dados).** O editor hoje reconstrói o
layout explicitamente em `normalizeLayout` + `sanitizeLayoutForSave` (`{ filters,
rows }`), descartando qualquer chave desconhecida. Sem tratar isso, **abrir e
salvar** um dashboard com abas no editor **apagaria as abas**. Tem de entrar
junto, não depois.

**Nível 2 (o pedido: criar/renomear/ordenar).** Entra como operações puras em
`lib/layout-editor.ts` + um painel `TabsEditor`, seguindo o padrão do
`FiltersEditor` (sem drag-and-drop, tudo por botão — decisão travada do MVP e
que já garante operação por teclado).

## 8. Acessibilidade da navegação por abas

`TabList` do Astryx com `orientation="vertical"` já entrega o padrão WAI-ARIA de
*tab strip*: um único ponto de tabulação (roving tabindex), setas ↑/↓ (e ←/→)
para mover, Home/End, e `aria-current="page"` no item selecionado. O DS renderiza
`<nav aria-label>` + `<button>` — navegação semântica, não `role="tablist"`.
O painel de conteúdo é uma `region` rotulada com o título da aba ativa, e a aba
ativa vive na URL (`?tab=<id>`), então voltar/avançar do navegador e link
compartilhado funcionam.

## 9. Escopo entregue × adiado

| Item | Status |
|---|---|
| `tabs` no contrato + normalizador + testes | entregue |
| Backend: Zod, add_chart, testes de retrocompat | entregue |
| Rota de visualização própria com sidebar lateral | entregue |
| Editor: preservar abas no save (anti perda de dados) | entregue |
| Editor: criar/renomear/ordenar/remover aba + mover linha entre abas | entregue |
| Agente/MCP escreverem `tabs` direto | **adiado** — §10 |
| `/dashboards/:id` (detalhe antigo) virar tab-aware | **adiado** — §10 |
| Preview do editor mostrar aba a aba | **adiado** — §10 |

## 10. Impedimentos e alternativas

### 10.1 O agente ainda não cria abas (impedimento de ownership)

`src/modules/mcp/tools/dashboards.ts` declara o layout aceito pelas tools com
`additionalProperties: false` e só `filters`/`rows`. Enquanto esse schema não
listar `tabs`, o agente é *informado* de que abas não existem e não as escreve.
O arquivo está fora do ownership deste trabalho (`modules/mcp/**`).

**Impacto real: nenhum hoje** — o backend aceita `tabs`, o editor humano cria e
o viewer mostra. E o caminho do agente continua correto por construção: uma
linha inserida por ele sem aba vira órfã e o normalizador a recupera na primeira
aba (regra 4 do §5), então nada some.

**Alternativa (3 linhas, quando alguém puder tocar o arquivo):** acrescentar
`tabs` ao `layoutJsonSchema` e uma frase na descrição da tool. Nenhuma mudança
de service é necessária — o service já aceita.

### 10.2 A tela de detalhe (`/dashboards/:id`) mostra as abas achatadas

Ela renderiza `layout.rows` direto. Num dashboard com abas isso exibe todas as
linhas empilhadas: **degradado, não quebrado** — nada some, e é para lá que o
botão “Visualização” leva o usuário. Foi deixado assim de propósito para a rota
nova ser 100% aditiva e não mexer no comportamento (nem nos testes) da tela que
já existe.

**Alternativa:** reusar `resolveTabs` + `layoutForTab` lá também, com o
`TabList` na horizontal em vez de lateral (a tela já tem uma `Toolbar` no topo).

### 10.3 Preview do editor é achatado

Mesma situação, e aqui é a escolha certa: editando, o usuário quer ver tudo o
que mexeu. Ver a nota em `use-editor-preview.ts`.
