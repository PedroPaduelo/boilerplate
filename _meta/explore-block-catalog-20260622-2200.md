# Exploração: Catálogo de blocos/componentes (backend ↔ frontend ↔ shared/contracts)

> Pergunta: mapear como o catálogo de blocos usado pelo MCP é definido (backend), como o frontend renderiza cada bloco, e onde mora o contrato compartilhado — para construir uma página de catálogo visual no frontend.
> Data: 2026-06-22 22:00 · Stack: Vite/React (FE) + Fastify/Prisma (BE) + `@dashboards/contracts` (JSON Schema neutro + ajv) · áreas tocadas: `backend-boilerplate/src/catalog`, `backend-boilerplate/scripts`, `backend-boilerplate/src/lib/catalog.ts`, `backend-boilerplate/src/modules/catalog`, `backend-boilerplate/src/modules/mcp/tools/catalog.ts`, `shared/contracts/src`, `frontend-boilerplate/src/shared/render-engine`, `frontend-boilerplate/src/app/routes.tsx`, `frontend-boilerplate/src/app/app-sidebar.tsx`.

## Resposta direta

**A fonte da verdade do catálogo é o FRONTEND**, não o backend. Cada bloco vive em `frontend-boilerplate/src/shared/render-engine/catalog/<type>/{manifest.ts, component.tsx, fixture.ts}` (pasta isolada, autodiscovery via `import.meta.glob`). O backend tem um script `npm run build:catalog` (`backend-boilerplate/scripts/build-catalog.ts`) que varre essas pastas, valida cada `manifest.ts` contra o JSON Schema `BlockManifestSchema` de `@dashboards/contracts` e gera `backend-boilerplate/src/catalog/catalog.manifests.json` (artefato gerado, NÃO editar). Esse JSON é importado em runtime pelo backend (`src/lib/catalog.ts`) e exposto: **(a)** como `GET /catalog` via módulo `modules/catalog` (atualmente só scaffold — ver Lacunas), e **(b)** como tool MCP `list_catalog` em `modules/mcp/tools/catalog.ts`. O render no FE é feito por um `import.meta.glob` em `shared/render-engine/registry.ts` que monta `type → BlockDefinition` em runtime; `BlockRenderer` (`block-renderer.tsx`) resolve `block.type → definition → Component`, mescla `manifest.defaultProps + block.props` e injeta `data` no shape declarado pelo `dataContract`. A página `/dashboards/:id` (`features/dashboards/components/dashboard-view.tsx`) usa `DashboardRenderer` (`shared/render-engine/dashboard-renderer.tsx`) que monta o grid 12-col e chama `BlockRenderer` por bloco. Hoje há **8 tipos** registrados (7 reais + `__example` placeholder): `kpi` (scalar), `bar_chart` (series), `line_chart` (series), `donut` (categorical), `table` (table), `title` (narrativo), `rich_text` (narrativo), `__example` (placeholder).

## Onde está

### Backend — geração, leitura, exposição do catálogo

- `backend-boilerplate/src/catalog/catalog.manifests.json:1` — **ARTEFATO GERADO** (header `GERADO por npm run build:catalog — NÃO edite à mão`). Contém o array `blocks: BlockManifest[]` (8 entradas) com `type, kind, name, description, source, propsSchema, dataContract {shape, spec, example}, defaultProps, version`. Esse é o snapshot que o BE/MCP consomem.
- `backend-boilerplate/src/catalog/README.md:1` — convenção do artefato gerado e comandos.
- `backend-boilerplate/scripts/build-catalog.ts:1` — coletor (153 linhas). Varre `CATALOG_DIR` (default `../frontend-boilerplate/src/shared/render-engine/catalog`), carrega `manifest.ts`/`manifest.tsx` de cada pasta, valida cada manifesto contra `BlockManifestSchema` via `validateBlockManifest` (ajv), rejeita duplicatas de `type`, ordena por `type` e escreve o JSON em `CATALOG_OUT` (default `src/catalog/catalog.manifests.json`). Tem modo `--watch` (`build:catalog:watch`).
- `backend-boilerplate/src/lib/catalog.ts:1` — **leitor** do catálogo gerado. Exporta `listCatalogManifests()`, `getCatalogManifest(type)`, `listCatalogTypes()`, `hasCatalogType(type)`, `getCatalogDataShape(type)` e `validatePropsAgainstCatalog(type, props)` (compila ajv do `propsSchema` por tipo, com cache). Importa o JSON inlined (funciona em dev/build/test).
- `backend-boilerplate/src/modules/catalog/index.ts:1` — plugin Fastify auto-descoberto. **HOJE só expõe `GET /catalog/_status`** (scaffold marker — `{module:'catalog', status:'scaffolded'}`); **NÃO serve o JSON de manifestos em `GET /catalog` ainda** (doc 31 previa isso, ver Lacunas).
- `backend-boilerplate/src/modules/mcp/tools/catalog.ts:1` — tool MCP `list_catalog`. Aceita `{type?: string}` e retorna `{blocks, total}` lendo de `@/lib/catalog`. Documentação no `description` orienta a IA a usar `dataContract.shape` para casar com o `transform` da query.
- `backend-boilerplate/src/modules/mcp/tools/index.ts:14` — registro central das tools: `connectionTools`, `catalogTools`, `chartTools`, `dashboardTools` (4 domains).
- `backend-boilerplate/src/modules/mcp/protocol.ts:127` — método MCP `tools/list` chama `listToolDescriptors()` que serializa `{name, description, inputSchema}` de todas as tools (incluindo `list_catalog`).
- `backend-boilerplate/src/http/modules-loader.ts:1` — autoload dos módulos de domínio (`@fastify/autoload` em `src/modules/`), descobre `index.ts` por pasta.
- `backend-boilerplate/tests/catalog.test.ts:1` — testes E2E do pipeline: roda `npm run build:catalog`, revalida TODOS os manifestos contra `BlockManifestSchema`, confirma presença de `__example` e dos 7 da base (`kpi/bar_chart/line_chart/donut/table/title/rich_text`) e checa `dataContract.shape` esperado.
- `backend-boilerplate/package.json:10-11` — scripts `"build:catalog"` e `"build:catalog:watch"`.

### Shared / Contracts — fonte da verdade do schema

- `shared/contracts/src/index.ts:1` — barrel principal. Exporta `schemas`, `types` (TS), `validation/validator` (ajv), `socket/events`, `fixtures`.
- `shared/contracts/src/schemas/block-manifest.schema.ts:1` — **`BlockManifestSchema`** (JSON Schema draft-07). Define `required: [type, kind, name, description, source]`; `kind: enum('chart'|'text'|'title'|'layout')`; `dataContract: {shape: enum('scalar'|'series'|'categorical'|'table'), spec, example}`. É o que `build:catalog` valida.
- `shared/contracts/src/schemas/block-data.schema.ts:1` — **`ScalarDataSchema`, `SeriesDataSchema`, `CategoricalDataSchema`, `TableDataSchema`** — um por shape, validados em runtime via `validateBlockDataByShape(shape, data)`.
- `shared/contracts/src/schemas/data-payload.schema.ts:1` — `BlockDataResultSchema` (`{blockId, state: enum('idle'|'queued'|'running'|'success'|'error'), shape?, data?, error?, meta?}`) e `DashboardDataPayloadSchema` (`{dashboardId, blocks: Record<blockId, BlockDataResult>}`).
- `shared/contracts/src/schemas/dashboard-layout.schema.ts:1` — `DashboardLayoutSchema` (`{filters[], rows[]}`) + `DashboardConfigSchema` (metadados + layout). Define `block: {id, type, span: 1-12, props?, dataBinding?}` e `dataBinding: {connectionId, query, params?, transform?, ttlSeconds?}`.
- `shared/contracts/src/types/index.ts:1` — tipos TS via `FromSchema<typeof XxxSchema>` (json-schema-to-ts): `BlockManifest`, `ScalarData`, `SeriesData`, `CategoricalData`, `TableData`, `BlockData = Scalar|Series|Categorical|Table`, `BlockDataResult`, `DashboardDataPayload`, `DashboardLayout`, `Block`, `Row`, `Filter`, `DataBinding`.
- `shared/contracts/src/validation/validator.ts:1` — instância ajv compartilhada + `validateBlockManifest`, `validateScalarData`, `validateSeriesData`, `validateCategoricalData`, `validateTableData`, `validateBlockDataByShape(shape, data)`, `formatErrors`, `ContractValidationError`, `assertValid`.
- `shared/contracts/src/fixtures/manifests.ts:1` — **manifestos da base inicial** (`kpiManifest`, `barChartManifest`, `lineChartManifest`, `donutManifest`, `tableManifest`, `titleManifest`, `richTextManifest`) + array `baseManifests`. São objetos `satisfies BlockManifest` prontos — T-I pode reusar.
- `shared/contracts/src/fixtures/dashboard.ts:1` — `dashboardConfigFixture` ("Dívida Ativa 2026") exercitando os 7 blocos + 2 filtros + 3 rows; `dashboardLayoutFixture` (subset `{filters, rows}`).
- `shared/contracts/src/fixtures/data-payload.ts:1` — `dashboardDataPayloadFixture` com 1 `scalar`, 2 `series`, 1 `categorical`, 1 `queued` — é o que o FE usa como mock de `BlockDataResult`.

### Frontend — render-engine e componentes

- `frontend-boilerplate/src/shared/render-engine/registry.ts:1` — **registry via `import.meta.glob`**. `buildRegistry(mods)` extrai `definition` (ou `default`) de cada `catalog/*/component.tsx`, monta `Map<type, BlockDefinition>`. Exporta `getBlock(type)`, `listBlocks()`, `listBlockTypes()`, `hasBlock(type)`. Valida consistência `pasta.type === manifest.type` (warn se divergir).
- `frontend-boilerplate/src/shared/render-engine/types.ts:1` — `BlockDefinition<P,D> = {type, manifest: BlockManifest, Component: BlockComponent, fixture?}`. `BlockComponent<P,D>` recebe `{props, data, state, error?}`. Helper `defineBlock<P,D>(def)`. `BlockRenderState = 'skeleton'|'loading'|'success'|'error'|'empty'`.
- `frontend-boilerplate/src/shared/render-engine/block-renderer.tsx:1` — **render de 1 bloco**. `resolveState(hasDataContract, result)` decide o estado (narrativos → sempre `success`); blocos de dados → `skeleton` (sem result), `loading` (queued/running), `error` (com `result.error.message`), `empty` (data vazio), `success` (senão). Mescla `props = {...manifest.defaultProps, ...block.props}`. Tipo não registrado → placeholder "Bloco não implementado: <code>type</code>".
- `frontend-boilerplate/src/shared/render-engine/dashboard-renderer.tsx:1` — render da grade. Recebe `DashboardLayout` (`{filters, rows}`) + `DashboardDataPayload` opcional. Cada row → `<section>` com grid `grid-cols-12 gap-4`; cada block → `<div style={gridColumn: span N/span N}>` com `<BlockRenderer block={block} result={data?.blocks?.[block.id]} />`.
- `frontend-boilerplate/src/shared/render-engine/index.ts:1` — barrel: `getBlock`, `listBlocks`, `listBlockTypes`, `hasBlock`, `buildRegistry`, `BlockRenderer`, `DashboardRenderer`, `*types`.

### Frontend — pasta `catalog/` (cada bloco = 1 pasta isolada)

| type | pasta | `manifest.ts` (linhas) | `component.tsx` (linhas) | `dataContract.shape` | defaultProps | Vitrine UI importada |
|---|---|---|---|---|---|---|
| `kpi` | `catalog/kpi/` | `manifest.ts` 28L | `component.tsx` 38L | `scalar` | `{showDelta: true}` | `@/components/ui/kpi-card` |
| `bar_chart` | `catalog/bar_chart/` | `manifest.ts` 36L | `component.tsx` 36L | `series` | `{orientation: 'vertical', stacked: false}` | `@/components/ui/bar-chart` |
| `line_chart` | `catalog/line_chart/` | `manifest.ts` 32L | `component.tsx` 51L | `series` | `{smooth: true, area: true}` | `@/components/ui/line-chart` |
| `donut` | `catalog/donut/` | `manifest.ts` 29L | `component.tsx` 64L | `categorical` | `{showLegend: true}` | `@/components/ui/donut-chart` |
| `table` | `catalog/table/` | `manifest.ts` 36L | `component.tsx` 56L | `table` | `{pageSize: 10}` | `@/components/ui/table` (shadcn) |
| `title` | `catalog/title/` | `manifest.ts` 27L | `component.tsx` 50L | — (narrativo) | `{level: 2, align: 'left'}` | (nenhum) |
| `rich_text` | `catalog/rich_text/` | `manifest.ts` 21L | `component.tsx` 24L | — (narrativo) | `{markdown: ''}` | (nenhum; usa `markdown.ts` local) |
| `__example` | `catalog/__example/` | `manifest.ts` 28L | `component.tsx` 30L | — (sem `dataContract`) | `{label: 'Auto-registrado ✔'}` | (nenhum) |

Caminhos completos:
- `frontend-boilerplate/src/shared/render-engine/catalog/kpi/manifest.ts:1` + `component.tsx:1` + `fixture.ts:1`
- `frontend-boilerplate/src/shared/render-engine/catalog/bar_chart/manifest.ts:1` + `component.tsx:1` + `fixture.ts:1`
- `frontend-boilerplate/src/shared/render-engine/catalog/line_chart/manifest.ts:1` + `component.tsx:1` + `fixture.ts:1`
- `frontend-boilerplate/src/shared/render-engine/catalog/donut/manifest.ts:1` + `component.tsx:1` + `fixture.ts:1`
- `frontend-boilerplate/src/shared/render-engine/catalog/table/manifest.ts:1` + `component.tsx:1` + `fixture.ts:1`
- `frontend-boilerplate/src/shared/render-engine/catalog/title/manifest.ts:1` + `component.tsx:1` + `fixture.ts:1`
- `frontend-boilerplate/src/shared/render-engine/catalog/rich_text/manifest.ts:1` + `component.tsx:1` + `fixture.ts:1` + `markdown.ts:1` (sanitização)
- `frontend-boilerplate/src/shared/render-engine/catalog/__example/manifest.ts:1` + `component.tsx:1` + `fixture.ts:1`

Componentes Vitrine (shadcn-like, reutilizados pelos blocos):
- `frontend-boilerplate/src/components/ui/kpi-card.tsx:1` — `<KpiCard label value prefix? suffix? delta? hint? icon? trend? higherIsBetter? />` (83L).
- `frontend-boilerplate/src/components/ui/bar-chart.tsx:1` — `<BarChart series={[{label,value}...]} accent="bg-chart-1" />` (66L, SVG/divs puros).
- `frontend-boilerplate/src/components/ui/line-chart.tsx:1` — `<LineChart series={[{label, data, className}...]} xLabels? showArea? showGrid? showLegend? />` (215L, SVG puro, agrupa por série).
- `frontend-boilerplate/src/components/ui/donut-chart.tsx:1` — `<DonutChart segments={[{label,value,className}...]} size? thickness? />` (82L, SVG, pré-computa `dash`/`offset` por arco).

### Frontend — rotas, sidebar e fluxo da dashboard-view

- `frontend-boilerplate/src/app/routes.tsx:1` — **router central** (47L). Usa `createBrowserRouter`. Carrega rotas públicas de auth (`/login`, `/register`) + `collectFeatureRoutes()` (lê `features/*/routes.tsx` via `import.meta.glob`) e injeta `...publicRoutes` e `...protectedRoutes` dentro do `DashboardLayout` (autenticado por `ProtectedRoute`). Rota catch-all → `/`. **NÃO adicionar rotas de feature aqui.**
- `frontend-boilerplate/src/shared/lib/feature-routes.ts:1` — contrato `FeatureRoutes { public?, protected? }`. `collectFeatureRoutes()` varre `../../features/*/routes.tsx` (eager, glob). É o ponto de extensão das features.
- `frontend-boilerplate/src/app/dashboard-layout.tsx:1` — shell autenticado (`<Outlet />` dentro de `DashboardLayout` + sidebar + topbar + theme toggle). Mapa `TITLES` (`/dashboards → 'Dashboards'`, `/charts → 'Gráficos'`, etc.) — adicionar entrada para a nova rota.
- `frontend-boilerplate/src/app/app-sidebar.tsx:44` — **lista NAV** (`NavItem[]`). Hoje: `/dashboards` (artifacts:view), `/charts` (artifacts:view), `/connections` (connections:use), `/chat` (artifacts:manage), `/users` (ADMIN). Filtragem via `canSeeNavItem` (RBAC). **Para adicionar uma aba "Catálogo", editar este array + o `TITLES` no `dashboard-layout.tsx`.**
- `frontend-boilerplate/src/features/dashboards/routes.tsx:1` — exemplo de como declarar rotas de feature. `protected: [dashboards, dashboards/:id, dashboards/:id/edit]` com lazy + `RequireRole`.
- `frontend-boilerplate/src/features/charts/routes.tsx:1` — outro exemplo: lista `charts` e `charts/:id` (este último é `PlaceholderPage`).
- `frontend-boilerplate/src/features/dashboards/components/dashboard-view.tsx:1` — **tela `/dashboards/:id`** (235L). Fluxo: `useDashboard(id, 'draft')` → 1 GET → `pickEffectiveLayout(detail, mode)` decide draft/published → `useDashboardData({dashboardId, mode, filters: values})` retorna `payload: DashboardDataPayload` (mapa `blockId → BlockDataResult`) → passa para `<DashboardRenderer layout={gridLayout} data={payload} />` (com `filters: []` porque a `FilterBar` interativa fica acima).
- `frontend-boilerplate/src/features/dashboards/use-dashboard-data.ts:1` — hook que faz o batch `POST /dashboards/:id/data` + escuta socket; re-hidrata blocos.

## Como funciona / fluxo

**Pipeline ponta a ponta do catálogo:**

1. **Autoria (FE):** Dev cria `frontend-boilerplate/src/shared/render-engine/catalog/<novo_type>/{manifest.ts, component.tsx, fixture.ts}`. O `manifest.ts` é `satisfies BlockManifest` (validado pelo TS via `BlockManifest` de `@dashboards/contracts`); o `component.tsx` exporta `definition = defineBlock({type, manifest, Component, fixture})` + `default`.
2. **Auto-registro FE (build/dev):** `registry.ts` faz `import.meta.glob('./catalog/*/component.tsx', {eager:true})` → `buildRegistry` → `Map<type, BlockDefinition>`. Disponível via `getBlock(type)`/`listBlocks()` sem editar índice central.
3. **Auto-registro BE/IA (build):** `npm run build:catalog` (`scripts/build-catalog.ts`) varre `CATALOG_DIR` (default aponta para a pasta do FE), carrega cada `manifest.ts`, valida via `validateBlockManifest(manifest)` (ajv contra `BlockManifestSchema`), rejeita duplicatas, escreve `src/catalog/catalog.manifests.json`. Tem modo `--watch` para dev.
4. **Consumo BE (runtime):** `src/lib/catalog.ts` importa o JSON inlined e expõe `listCatalogManifests`, `getCatalogManifest`, `hasCatalogType`, `getCatalogDataShape`, `validatePropsAgainstCatalog` (compilação ajv do `propsSchema` com cache).
5. **Exposição REST:** `modules/catalog/index.ts` (HOJE só `_status` — scaffold; ver Lacunas).
6. **Exposição MCP:** `modules/mcp/tools/catalog.ts` define a tool `list_catalog` (filtro opcional por `type`); `tools/index.ts:14` agrega-a; `protocol.ts:127` (`tools/list`) e `protocol.ts:140` (`tools/call`) despacham para ela via `getTool(name).handler(args, {actor})`.
7. **Render do bloco:** `<BlockRenderer block={block} result={data?.blocks?.[block.id]} />` resolve `getBlock(block.type)` → `definition.Component`; mescla `{...manifest.defaultProps, ...block.props}`; injeta `data` (validado contra o `dataContract.shape` no backend, antes de cache/socket). `state` decide se mostra skeleton/loading/error/empty ou renderiza o `Component` com `state="success"`.
8. **Render da dashboard:** `dashboard-view.tsx` → `DashboardRenderer` → grid 12-col com `span` por bloco → `BlockRenderer` por bloco. Filtros interativos ficam na `FilterBar` separada (acima do `DashboardRenderer`, que recebe `filters: []`).

**Convenção plug-and-play (regra anti-colisão do doc 21):**
- **FE:** `catalog/<type>/pasta` isolada, descoberta via glob. Não há índice central.
- **BE/IA:** a única "índice" é o JSON gerado (`catalog.manifests.json`), regenerado a cada `build:catalog`.

## Pontos de atenção

1. **A rota REST `GET /catalog` NÃO existe ainda** — `modules/catalog/index.ts:30` só expõe `GET /catalog/_status` retornando `{module:'catalog', status:'scaffolded'}`. Para a página "Catálogo" no FE, ou (a) implementar `GET /catalog` que serve `listCatalogManifests()` de `@/lib/catalog`, ou (b) fazer o FE ler `manifests` do `baseManifests` exportado de `@dashboards/contracts` (`shared/contracts/src/fixtures/manifests.ts:148`) — são os mesmos 7 objetos que o `build:catalog` coletaria. **Opção (b) é mais barata e já está validada pelo `tests/catalog.test.ts:43`.** O MCP já tem `list_catalog` consumindo o JSON gerado.
2. **`__example` é placeholder de F0.4** — o cabeçalho dos manifestos do FE diz "T-I implementa os 7 blocos da base criando pastas irmãs — sem tocar neste arquivo" e `catalog.test.ts:43` confirma que ele ainda é coletado. Para o catálogo visual, considere filtrá-lo (ex.: `listBlocks().filter(b => b.type !== '__example')`) — ou renderizar com um badge "placeholder".
3. **Tipos derivados de JSON Schema no FE** — `block-renderer.tsx:14` e os blocos `bar_chart/component.tsx:23`, `donut/component.tsx:21`, `table/component.tsx:29`, `kpi/component.tsx:14` anota `data` localmente (`type SeriesPoint = ...`) porque `json-schema-to-ts` não é dep do FE. Não usar `as any` no consumidor novo; preferir anotar o tipo esperado.
4. **`title` aceita `level: 1-6` mas o `BlockTitleProps` está anotado `1|2|3|4|5|6`** — combinação de nível + alinhamento é puramente visual; `BLOCK_TITLE` (`component.tsx:14`) tem mapa `LEVEL_TAG`/`LEVEL_CLASS`/`ALIGN_CLASS`. **Não há risco de drift** aqui.
5. **Blocos narrativos vs dados** — `block-renderer.tsx:21` decide: `if (!hasDataContract) return 'success'`. Garantir que novos blocos narrativos omitam `dataContract` no `manifest` e a IA (via MCP) não vai exigir `dataBinding` na criação.
6. **`dataContract.spec` é descritivo, não prescritivo** — `kpi` declara `{value: number, label: string?, delta: number?}` mas o `ScalarDataSchema` (mais estrito) exige `value: number|null` e aceita `unit/format` que o spec do manifesto não cita. Há drift entre o spec do manifesto e o schema de validação — conviver é OK (spec é p/ a IA entender, schema é p/ validar). Não mudar um sem mudar o outro.
7. **`kind` aceita `'layout'` no schema** mas os 7 blocos da base não usam — só `chart`, `text`, `title`. Se criar um bloco de layout (container/grid), pode usar.
8. **Sidebar/Títulos centralizados** — `app-sidebar.tsx:44` (NAV) e `dashboard-layout.tsx:11` (TITLES) são os **dois** pontos a tocar para uma aba nova. Para "Catálogo", provavelmente `permission: 'artifacts:view'` (mesma dos charts).
9. **`routes.tsx` é território FECHADO** — `app/routes.tsx:14` (header): "NÃO adicione rotas de feature aqui". A nova aba precisa de um `features/catalog/routes.tsx` (auto-descoberto por `collectFeatureRoutes`).
10. **Recharts NÃO é usado** — apesar de ser o padrão óbvio de chart em React, todos os charts da Vitrine são SVG/divs puros com classes Tailwind (`@/components/ui/bar-chart.tsx:3`, `line-chart.tsx:3`, `donut-chart.tsx:3`). Manter essa filosofia se adicionar novos charts.
11. **`BlockDataResult.state` carrega 5 valores** (`idle|queued|running|success|error`), `BlockRenderState` no FE carrega 5 valores diferentes (`skeleton|loading|success|error|empty`) — `block-renderer.tsx:21` mapeia entre eles. Não confundir.
12. **Existe `data-payload.schema.ts` mas o `BlockDataRequest` (entrada do batch) está em `api-dto.schema.ts`** — referenciado como `BlockDataRequest` em `types/index.ts:79` (`{filterId, as}[]`). Para o catálogo visual não importa.

## Lacunas

1. **Endpoint `GET /catalog` real NÃO está implementado** — `backend-boilerplate/src/modules/catalog/index.ts:30` é só scaffold (`/catalog/_status`). O `lib/catalog.ts` já tem tudo pronto para servir (`listCatalogManifests()`). O comentário do módulo diz "TRILHAS T-I / T-D" indicando que está marcado para implementação. **Recomendação para o pai:** não bloquear o catálogo visual do FE por causa disso — usar `baseManifests` de `@dashboards/contracts` ou `listBlocks()` de `@/shared/render-engine` (que já existe e é a fonte mais fidedigna).
2. **Não confirmei se há rota `pages/admin` ou equivalente** — só vi features padrão. A página "Catálogo" provavelmente vai morar como nova feature (`features/catalog/`), não dentro de `features/charts/`.
3. **Não medi o tamanho do JSON gerado** para `GET /catalog` — os 7 manifestos atuais (~5 KB no `catalog.manifests.json`) cabem tranquilamente sem paginação.
4. **Faltou verificar testes do registry** — `frontend-boilerplate/src/shared/render-engine/registry.test.ts:1` (1145B) e `dashboard-renderer.test.tsx:1` (2172B) existem mas não foram lidos; podem ter detalhes sobre a forma esperada de `definition` para o catálogo visual.
5. **Bloco `__example` será removido?** O README do catálogo sugere "Pode ser removido quando a base real (T-I) estiver no lugar", mas T-I já está em pé (kpi/bar/line/donut/table/title/rich_text). Hoje ainda está no registry — filtrar ou remover.