# 20 — Contrato do Dashboard (ponta a ponta) — O CORAÇÃO

> Status: ✅ CONFIRMADO pelo usuário (rodada 6). É o documento mais importante:
> uma vez fechado, vira a **fronteira** que permite paralelizar BE, FE e a
> biblioteca de componentes sem colisão.

## 0. Princípio: 3 coisas independentes

O usuário separou explicitamente três responsabilidades que NÃO podem se misturar:

1. **LAYOUT/CONFIG** — a estrutura da tela do dashboard (configurável): filtros,
   seções (linhas), quais blocos/gráficos existem e suas props. Muda **pouco**
   (só quando o agente edita ou publica). → **Cache de LAYOUT**.
2. **DADOS** — o resultado das queries que hidratam cada bloco. Muda conforme o
   dado de origem. → **Cache de DADOS**, com **TTL por gráfico**.
3. **CONTRATO DO BLOCO** — cada tipo de gráfico/bloco do catálogo declara o
   **shape de dados** que sabe renderizar. O resultado da query precisa ser
   **transformado** para esse shape antes de chegar ao componente.

```
DashboardConfig (LAYOUT)  ──referencia──►  Catálogo (CONTRATO por bloco)
        │                                          ▲
        │ cada bloco tem um dataBinding            │ shape esperado
        ▼                                          │
   Execução de query (DADOS) ──transforma para──► shape do bloco ──► componente
```

## 1. Camada 1 — Contrato de LAYOUT (DashboardConfig)

Esboço do JSON salvo no banco (a refinar):

```jsonc
{
  "id": "dash_123",
  "version": 4,                 // versão da config (publish/versionamento)
  "status": "published",        // "draft" | "published"
  "title": "Dívida Ativa 2026",
  "ownerId": "user_...",
  "departmentId": "dep_...",
  "visibility": "department",   // "private" | "department" | "org"
  "filters": [
    {
      "id": "f_periodo",
      "type": "date_range",     // date_range | select | multiselect | search | number_range
      "label": "Período",
      "default": { "from": "2026-01-01", "to": "2026-12-31" }
    }
  ],
  "rows": [                     // seções (linhas)
    {
      "id": "row_1",
      "title": "Visão geral",   // título de seção (opcional)
      "blocks": [
        {
          "id": "blk_a",
          "type": "bar_chart",  // referencia um tipo do CATÁLOGO
          "span": 6,            // largura no grid (ex.: 12 colunas)
          "props": { "stacked": false, "orientation": "vertical" },
          "dataBinding": {
            "connectionId": "conn_...",
            "query": "SELECT ...",
            "params": [                       // bind de filtros -> parâmetros da query
              { "filterId": "f_periodo", "as": "periodo" }
            ],
            "transform": "ref_ou_mapeamento", // mapeia resultado -> shape do bloco
            "ttlSeconds": 86400               // TTL de cache de DADOS deste gráfico
          }
        },
        {
          "id": "blk_b",
          "type": "rich_text",  // bloco SEM dados (texto/markdown do relatório)
          "span": 6,
          "props": { "markdown": "## Análise\n..." }
        }
      ]
    }
  ]
}
```

Observações:
- **Filtro seletivo por gráfico**: um bloco só "escuta" um filtro se houver entrada
  correspondente no seu `dataBinding.params`. Filtro do topo aplicado a um gráfico e
  não a outro = exatamente isso.
- Blocos de **texto/título/seção** não têm `dataBinding` (são parte do relatório narrativo).
- **TTL é por bloco** (`dataBinding.ttlSeconds`), confirmando o requisito.

### Cache de LAYOUT
- Chave: `dashboard:{id}:config:v{version}` (ou por status published).
- Invalidação: ao **publicar** (gera nova versão / troca ponteiro published).
- Em **dev/draft**: lê sempre do banco (sem cache agressivo).

## 2. Camada 2 — Contrato do BLOCO (catálogo)

Cada tipo de bloco do catálogo declara um **manifesto** (a documentação rígida do MCP):

```jsonc
{
  "type": "bar_chart",
  "name": "Gráfico de Barras",
  "description": "Compara valores entre categorias.",
  "propsSchema": { /* schema (Zod) das props visuais */ },
  "dataContract": {
    "shape": "series",                 // formato esperado
    "spec": {
      "x": { "type": "category", "required": true },
      "y": { "type": "number", "required": true },
      "series": { "type": "category", "required": false }
    },
    "example": [ { "x": "Jan", "y": 120 }, { "x": "Fev", "y": 90 } ]
  },
  "minColumns": 1, "maxRows": 5000     // capacidades/limites
}
```

- O **agente** lê esse manifesto via MCP para saber **quais dados** a query precisa
  produzir e **como** apresentar — garantindo a "conciliação" resultado↔gráfico.
- O **front** usa `propsSchema` + `dataContract.shape` para renderizar.
- O **back** usa `dataContract` para validar/transformar o resultado da query.

### Cache de DADOS
- Chave: hash de `connectionId + query + params(valores dos filtros) + version`.
- TTL: `dataBinding.ttlSeconds`.
- **dev**: bypass total (sempre fresco). **published**: usa cache.
- Fluxo: requisição → se cache hit, retorna; se miss, enfileira execução (BullMQ),
  worker roda query, transforma para o shape do bloco, grava cache, **emite socket**
  com o resultado para o(s) cliente(s) daquele dashboard.

## 3. Fluxo de render ponta a ponta

```
FE abre /dashboard/:id
  └─ GET config (cache de LAYOUT)            → desenha filtros + grid + skeletons
  └─ para cada bloco com dataBinding:
       POST /blocks/:id/data {filtros}
         ├─ cache de DADOS hit → 200 com dados → render
         └─ miss → 202 "enfileirado" → worker executa → socket "block:data" → render
```

- Estados por bloco: `idle | queued | running | success | error` (skeleton/erro isolados).
- Mudar filtro = recomputar só os blocos que escutam aquele filtro.

## 4. O que esse contrato destrava (paralelização)

Fixados os 3 contratos acima (tipos TS/Zod compartilhados), os times podem trabalhar
em paralelo: ver `21-estrategia-paralelizacao.md`.

## Materialização (F0.3 — implementado)

Os 3 contratos acima foram materializados como **JSON Schema neutro** (sem Zod,
por causa do conflito Zod v3 BE × v4 FE) no pacote único **`shared/contracts/`**
(`@dashboards/contracts`): schemas `as const` + tipos TS derivados
(`json-schema-to-ts`) + validador `ajv` + fixtures. BE e FE consomem via
dependência local `file:../shared/contracts` (build dual ESM+CJS). Detalhes,
mapa de schemas/tipos e modo de consumo em `shared/contracts/README.md`.

- LAYOUT → `DashboardLayoutSchema` (`{filters,rows}` salvo no banco) + `DashboardConfigSchema` (objeto completo).
- CONTRATO DO BLOCO → `BlockManifestSchema` + shapes `Scalar/Series/Categorical/Table`.
- DADOS (batch) → `DashboardDataPayloadSchema` / `BlockDataResultSchema` (estados idle|queued|running|success|error).
- Socket.IO → `SOCKET_EVENTS` (`block:queued|running|data|error`) + `dashboardRoom(id)`.
- DTOs de API → `Create/UpdateDashboardRequest`, `DashboardSummary/Detail`, `BlockDataRequest`, `ApiError`.

## Decisões em aberto deste contrato
- [ ] Grid: nº de colunas, responsividade, drag-and-drop de layout?
- [ ] `transform` resultado→shape: linguagem/mecanismo (mapeamento declarativo? a query
      já devolve no shape certo? função registrada?).
- [ ] Versionamento da config: nova linha por versão vs campo `version` + histórico.
- [ ] Endpoint de dados: 1 request por bloco vs batch por dashboard.
- [ ] Schema de `filters` e tipos suportados no MVP.
