# Exploração: UI do catálogo de blocos (galeria / block picker) — base p/ 7 abas por categoria

> Pergunta: onde o usuário lista/visualiza os blocos do catálogo, como a lista é montada hoje, e qual o caminho mais limpo pra introduzir 7 abas por categoria sem colidir com subs em andamento.
> Data: 2026-06-23 07:30 · Stack: React + Vite + react-router-dom + Tailwind/ui-shadcn · render-engine (frontend-boilerplate/src/shared/render-engine)

## Resposta direta

Existe **UMA** UI que lista todos os blocos: a galeria em `/catalog` (`features/catalog/components/catalog-page.tsx`). Ela enumera chamando `listBlocks()` do registry e itera `getCatalogEntries()` (`features/catalog/lib/catalog-entries.ts`), com **agrupamento atual por `kind`** (chart/title/text/layout) em **botões de filtro**, não em abas. O `kind` é campo de `BlockManifest` (enum fechado `chart | text | title | layout`, definido em `@dashboards/contracts`) — **não há** `category`/`group`/`tags` hoje. O caminho mais limpo e retrocompatível para 7 abas é **opção (b): mapa central `type→category` num arquivo NOVO em `features/catalog/lib/`**, consumido SÓ pela galeria, sem tocar `BlockManifest` (que é contrato FE+BE+IA+MCP, com `additionalProperties:false` — mexer é caro).

---

## 1. Onde está a UI que lista os blocos disponíveis

**UMA tela / UM picker no app** (não há "adicionar bloco" no editor):

- **Galeria `/catalog`** — `frontend-boilerplate/src/features/catalog/components/catalog-page.tsx` (linha 1).
  - Rota: `frontend-boilerplate/src/features/catalog/routes.tsx:24-30` (path `catalog`, exige permissão `artifacts:view`).
  - Item de menu (sidebar): `frontend-boilerplate/src/app/app-sidebar.tsx:64` (`{ id: '/catalog', label: 'Catálogo', icon: Blocks, permission: 'artifacts:view' }`).
  - Auto-descoberta pelo router: `frontend-boilerplate/src/app/routes.tsx:11` (`collectFeatureRoutes()` glob).
  - **Conteúdo**: cards de preview AO VIVO (`BlockPreviewCard`) + dialog de detalhes (`BlockDetailDialog`).

- **Editor de dashboard (`/dashboards/:id/edit`)** — `frontend-boilerplate/src/features/dashboards/components/dashboard-editor.tsx`:
  - **NÃO tem block picker por tipo de catálogo.** Usa `AddChartForm` (`features/dashboards/components/editor/add-chart-form.tsx`) que lista **Charts já existentes** (do módulo `features/charts`), NÃO os tipos de bloco do registry. Linhas 8-11 do form confirmam: "referencia um Chart existente e o insere como bloco".
  - Logo, introduzir abas no catálogo **não impacta** o editor de dashboard (subs paralelos do pai no editor ficam intactos).
- **Chat (`/chat`)** — `features/chat/components/*`: usa `inline-chart`/`add-to-dashboard-dialog` mas não enumera catálogo. Não consome o `listBlocks()`.

**Conclusão**: só `features/catalog/**` precisa de mudança.

## 2. Como esses lugares enumeram os blocos hoje

Toda a enumeração passa por `frontend-boilerplate/src/features/catalog/lib/catalog-entries.ts`:

- **Linha 138**: `getCatalogEntries()` chama `listBlocks()` (do registry — `shared/render-engine/registry.ts:60-62`, retorna `BlockDefinition[]`).
- **Linha 140**: filtra `HIDDEN_TYPES` (`__example`, linha 12).
- **Linha 141**: aplica `toEntry(def)` — deriva `{ type, definition, kind, shape, block, result, propsCount, hasData }` lendo `manifest.kind`, `manifest.dataContract?.shape`, `propsSchema.properties`, `defaultProps`, `fixture`.
- **Linha 142-146**: ordena por `KIND_ORDER` (chart=0, title=1, text=2, layout=3) e nome PT-BR.

**Como o registry descobre os blocos** (auto-registro, regra anti-colisão do projeto — doc 21): `frontend-boilerplate/src/shared/render-engine/registry.ts:22-26`:
```
const modules = import.meta.glob<BlockModule>('./catalog/*/component.tsx', { eager: true });
```
Cada pasta `catalog/<type>/` é auto-registrada ao existir — não há índice central. Cada bloco exporta `definition` no `component.tsx`. **Importante**: criar/editar pasta isolada = sem colisão com pai/outros subs (regra do projeto). Toda extensão precisa respeitar isso.

**Filtros existentes na galeria** (`catalog-page.tsx`):
- **Busca textual** (linhas 53-64): `search` case-insensitive contra `manifest.name`, `manifest.type`, `manifest.description`.
- **Filtro por `kind`** (linhas 32-43, renderizado linhas 100-119): botões `<Button>` com `variant=outline|default` mostrando `${KIND_LABEL[k]}s` + contagem. Ordem fixa: Todos → Gráficos → Títulos → Textos → Layouts.

**Não há** tabs (`Tabs` UI), não há agrupamento visual por seção, não há `category`/`group`/`tags` no manifest. O agrupamento atual é puramente por `kind` (enum de 4 valores).

## 3. Estrutura do `BlockManifest` e exposição pelo registry

**`BlockManifest` (fonte da verdade, contrato compartilhado FE+BE+IA)**:
- Schema: `shared/contracts/src/schemas/block-manifest.schema.ts:6-29`
- **Campos hoje**: `type`, `kind` (enum fechado `chart | text | title | layout` — linha 12), `name`, `description`, `source`, `propsSchema`, `dataContract`, `defaultProps`, `minColumns`, `maxRows`, `version`.
- `additionalProperties: false` no schema (linha 6) → **adicionar campo novo exige editar o JSON Schema**, regenerar `dist/` do `shared/contracts`, **commit do dist** (regra de deploy via Docker — `npm ci` do app copia do `dist/` versionado). **Operação cara**, única, mas não trivial.
- O `kind` é a ÚNICA taxonomia existente — semântica **técnica** (define se recebe moldura ChartWidget), não semântica de produto.

**`BlockDefinition` (espelho FE-only, em `frontend-boilerplate/src/shared/render-engine/types.ts:64-79`)**:
- `type`, `manifest: BlockManifest`, `Component`, `fixture?`, `deriveTakeaway?`.
- Importante: `manifest` é o **mesmo objeto** coletado pelo `build:catalog` do BE/IA. Mexer aqui é mexer no contrato.

**Exposição pelo registry** (`registry.ts:46-76`):
- `getBlock(type)`, `listBlocks()`, `listBlockTypes()`, `hasBlock(type)`, `buildRegistry(mods)` (este último exportado só p/ testes determinísticos).
- `listBlocks()` é o ÚNICO consumidor da galeria.

**Manifestos da base (7 fixos)**: `shared/contracts/src/fixtures/manifests.ts` — `kpi`, `bar_chart`, `line_chart`, `donut`, `table`, `title`, `rich_text` (exportados em `baseManifests`).

## 4. O `kind` é usado em algum lugar pra agrupar/estilizar? Quebraria algo?

**2 usos do `kind` no FE**:

1. **Frame/ChartWidget** — `frontend-boilerplate/src/shared/render-engine/block-renderer.tsx:148`:
   ```
   const shouldFrame = framed && def.manifest.kind === 'chart' && !SELF_CONTAINED.has(block.type);
   ```
   `SELF_CONTAINED` (linhas 53-61) já tem `kpi, metric_glow, stat_tile, signal_card, progress_bar, progress_circle, radial_gauge` — i.e. o `kind=chart` é refinado pela lista. Logo, **o `kind` carrega semântica de render** (visualização = moldura padrão) que NÃO deve ser rebaixado/duplicado para "categoria de UI". É dado técnico.

2. **Galeria** — `catalog-entries.ts:13` (`CatalogKind`), linha 21 (`KIND_LABEL`), linha 79 (`as CatalogKind`), linha 92 (ordem). Usado pra:
   - Render de badge: `block-preview-card.tsx:43` (`<Badge>{KIND_LABEL[kind]}</Badge>`) e `block-detail-dialog.tsx:62` (mesmo badge).
   - Filtro/botão na `catalog-page.tsx:33-44,100-119`.

**Mudar/duplicar o `kind` em `category` NÃO quebra nada** — o `kind` permaneceria como está (mesmo enum, mesmos usos); a `category` seria uma nova camada puramente de UI, ortogonal, consumida só pela galeria. Eles podem coexistir (e convém: 7 abas de categoria + filtro de `kind` legado poderiam até ser combináveis).

**Risco zero** se você mantiver `kind` intocado. **Risco real** se você MEXER no `BlockManifest` para adicionar `category` (veja §3 e §5).

## 5. Recomendação: caminho mais limpo e retrocompatível

### Opção (a) — `category` no `BlockManifest` (NÃO recomendada)

- **Onde editar**: `shared/contracts/src/schemas/block-manifest.schema.ts:7-26` (adicionar `category` no `properties`; garantir não obrigatório p/ retrocompat com manifestos já existentes); depois `BlockManifest` inferido em `shared/contracts/src/types/index.ts:50` se ajustar; depois **cada `manifest.ts` em `catalog/<type>/` precisa declarar `category`** (7+ arquivos). E o **BE** (já tem script `build:catalog` que varre `manifest.ts` e valida contra `BlockManifestSchema` — ver `frontend-boilerplate/src/shared/render-engine/catalog/README.md:97-103`).
- **Custo alto**:
  1. Mudar schema compartilhado = **rebuild do `shared/contracts/dist/` + commit** (regra de deploy Docker, ver playbook).
  2. Restartar o BE (validador ajv recarrega).
  3. Tocar 7+ arquivos isolados + (potencialmente) o BE/`build:catalog`.
- **Risco médio**: 1 campo novo no schema parece trivial, mas esquece o `dist/` versionado e o deploy sobe com contrato velho. **Drift potencial** entre FE (manifestos novos) e BE/IA.

### Opção (b) — mapa central `type → category` em arquivo NOVO (RECOMENDADA) ✅

- **Onde criar**: `frontend-boilerplate/src/features/catalog/lib/categories.ts` (novo, ainda não existe).
- **Forma** (sugestão, você decide a taxonomia):
  ```ts
  export const CATEGORIES = ['indicadores', 'tendencias', 'distribuicoes', 'tabulares', 'narrativos', 'layout', 'outros'] as const;
  export type Category = typeof CATEGORIES[number];
  export const CATEGORY_LABEL: Record<Category, string> = { /* ... */ };
  /** Mapa type→category (default 'outros' p/ tipos não classificados). */
  export const CATEGORY_BY_TYPE: Record<string, Category> = { /* bar_chart: 'tendencias', ... */ };
  export function categoryOf(type: string): Category { return CATEGORY_BY_TYPE[type] ?? 'outros'; }
  ```
- **Onde a galeria consome**:
  1. `features/catalog/lib/catalog-entries.ts:79-86` (`toEntry`): adicionar `category: categoryOf(manifest.type)` ao `CatalogEntry`.
  2. `features/catalog/components/catalog-page.tsx`:
     - Trocar a linha 22 (`const [kind, setKind] = useState<KindFilter>('all')`) por **`const [category, setCategory] = useState<Category | 'all'>('all')`**.
     - Trocar o cálculo de `kindFilters` (linhas 32-43) por uma `categoryFilters` com `CATEGORIES` como lista mestre + contagem por `categoryOf(entry.type)`.
     - Trocar a filter UI (linhas 100-119: `<Button>` em vez do `<Tabs>`). **Ação concreta**: substituir essa seção pelo componente `Tabs` já existente em `components/ui/tabs.tsx` (linha única do `frontend-boilerplate/src/components/ui/tabs.tsx` — shadcn padrão), com 8 abas (Todas + 7). A escolha de tabs vs botões é puramente estética; o projeto já tem `Tabs` instalado.
     - Trocar `entries.filter((e) => kind !== 'all' && e.kind !== kind)` (linha 55) por filtro por `category`.
     - **Decisão de produto (você decide)**: `kind` (chart/text/title/layout) vira (i) só badge no card, (ii) sub-filtro dentro da aba, ou (iii) some. O mais barato e retrocompat: **(i) — manter badge, filtro some**. Se quiser manter, adicione um segundo seletor (ex.: dropdown de `kind`) ao lado das abas.
  3. `BlockPreviewCard` e `BlockDetailDialog`: o badge `KIND_LABEL[kind]` pode continuar (não conflita com `category`).
- **Vantagens**:
  - **Zero toque** em `shared/contracts` (sem rebuild, sem risco de drift com BE/IA).
  - **Zero toque** nos 40+ `manifest.ts` de blocos (regra anti-colisão do projeto: "NÃO criar índice central" — mas aqui o "índice" é SÓ de UI, isolado em `features/catalog/lib/`, não em `shared/render-engine/`, não viola a regra).
  - Retrocompatível: bloco novo que não esteja no mapa cai em `'outros'` (default seguro). Sem quebrar nenhum dos 40+ blocos atuais.
  - Subs em andamento do pai no editor de dashboard / block-renderer / contratos **NÃO são afetados** (única fronteira tocada: `features/catalog/**` + opcionalmente `components/ui/tabs.tsx`).
- **Desvantagem** (aceitável): o "índice" de categoria é editado à mão. Se quiser, no futuro, dá pra mover para `manifest.ts` (opção a) **depois que estabilizar** — exatamente o oposto da sugestão (a).

### Comparação direta (a) vs (b)

| Critério | (a) `category` no manifest | (b) mapa central em `features/catalog/lib/` |
|---|---|---|
| Toca `shared/contracts`? | Sim (schema + dist + commit + restart BE) | **Não** |
| Toca `catalog/<type>/manifest.ts`? | Sim (40+ arquivos) | **Não** |
| Toca `block-renderer`/contrato? | Não diretamente, mas propaga | **Não** |
| Risco de colisão com subs do pai? | Médio (BE/IA/MCP) | **Mínimo** (só galeria) |
| Retrocompat c/ blocos sem tag? | Exige default ou `required` no schema | **Trivial** (default `'outros'`) |
| Taxonomia editável? | 1 lugar (schema central) | 1 lugar (categories.ts) |
| Custo total | Alto (rebuild, restart, 40+ arquivos) | **Baixo** (2-3 arquivos novos/editados) |

**Veredicto**: **opção (b)**. É mais barato, mais seguro, mais isolado, e respeita a regra anti-colisão do projeto.

---

## Pontos de atenção

- **`SELF_CONTAINED` no `block-renderer.tsx:53-61`** é uma lista HARD-CODED de tipos que NÃO recebem frame ChartWidget mesmo sendo `kind=chart`. Se você algum dia introduzir uma categoria "kpi/medidores", saiba que essa lista existe — não misturar semântica de frame com semântica de categoria de UI.
- **`HIDDEN_TYPES` em `catalog-entries.ts:12`** = `__example` apenas. Não toca em categoria.
- **Componente `Tabs` shadcn já existe** em `frontend-boilerplate/src/components/ui/tabs.tsx` (1962 bytes). Pode usar direto para as 7 abas (substituir a faixa de botões atuais de `kind`).
- **`listBlocks()` retorna `BlockDefinition[]`** na ordem de inserção do glob; a ordenação por `kind` acontece em `catalog-entries.ts:142-146`. Com abas, a ordenação vira por `category` → `name` (decisão sua).
- **Auto-registro via glob**: NÃO criar índice central novo em `shared/render-engine/` (violaria a regra anti-colisão do projeto, doc 21). O mapa de categorias fica em `features/catalog/lib/`, território da galeria.
- **Permissão da rota**: `/catalog` exige `artifacts:view` (`routes.tsx:25`). Sem mudança.

## Lacunas

- Não conferi se o `kind` é serializado/enviado para o BE em algum payload de publicação de dashboard — pode ser que o backend já tenha alguma noção de `kind` em `Block` ou `BlockManifest`. Se tiver, adicionar `category` no manifest propagaria (a confirmar com busca no `backend-boilerplate/src/catalog/`); mas como recomendação é (b), o BE fica intacto.
- Não há outro "block picker" no editor de dashboard — confirmado: `AddChartForm` referencia **Charts existentes** (entidade diferente), não tipos de catálogo. Então só a galeria precisa mudar para 7 abas; o editor não é afetado.
