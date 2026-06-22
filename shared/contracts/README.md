# @dashboards/contracts

Contratos **compartilhados** entre backend, frontend e MCP — a **fronteira** que
permite paralelizar as trilhas (T-A…T-J) sem colisão (ver
`docs/plano/21-estrategia-paralelizacao.md`).

> **Sem Zod.** O backend usa Zod v3 e o frontend usa Zod v4 — conflito travado.
> Por isso os contratos são **JSON Schema NEUTRO** (`as const`), com:
> - **tipos TS** derivados via [`json-schema-to-ts`](https://github.com/ThomasAribart/json-schema-to-ts) (zero runtime), e
> - **validação runtime** via [`ajv`](https://ajv.js.org/) (funciona em qualquer lado).
>
> Cada lado continua livre para usar o Zod que quiser nas suas próprias camadas;
> os contratos compartilhados nunca dependem de Zod.

## Onde isto vive e por quê

`shared/contracts/` na **raiz do monorepo** (irmão de `backend-boilerplate/` e
`frontend-boilerplate/`). Decisão registrada em `docs/plano/21` (item "Monorepo:
criar um pacote `shared/contracts` ou duplicar"): escolhemos **um pacote único**
para evitar duplicação divergente. É a **fonte da verdade única** dos contratos.

## O que está aqui (espelha o doc 20)

| Camada | Schema(s) | Tipo(s) TS |
|--------|-----------|------------|
| **LAYOUT** (Camada 1) | `DashboardLayoutSchema` (`{filters, rows}` salvo em `Dashboard.draftLayout`/`publishedLayout`), `DashboardConfigSchema` (objeto completo doc 20) | `DashboardLayout`, `DashboardConfig`, `Filter`, `Row`, `Block`, `DataBinding` |
| **CONTRATO DO BLOCO** (Camada 2) | `BlockManifestSchema` (`type/kind/name/propsSchema/dataContract`) | `BlockManifest`, `BlockKind`, `DataShape` |
| **Shapes de dados** | `ScalarDataSchema`, `SeriesDataSchema`, `CategoricalDataSchema`, `TableDataSchema` | `ScalarData`, `SeriesData`, `CategoricalData`, `TableData` |
| **DADOS (batch)** | `DashboardDataPayloadSchema`, `BlockDataResultSchema` | `DashboardDataPayload`, `BlockDataResult`, `BlockState` |
| **Socket.IO** | `SOCKET_EVENTS`, `Block{Queued,Running,Data,Error}EventSchema` | `ServerToClientEvents`, `BlockDataEvent`, … + `dashboardRoom()` |
| **DTOs de API** | `ApiError`, `DashboardSummary`, `DashboardDetail`, `Create/UpdateDashboardRequest`, `BlockDataRequest` | tipos homônimos |

**Fixtures** (`src/fixtures/`) — destravam o FE com dados mockados enquanto a
execução real (T-C) não existe:
- `dashboardConfigFixture` / `dashboardLayoutFixture` — dashboard "Dívida Ativa 2026" completo (2 filtros, 3 rows, os 7 tipos de bloco).
- `dashboardDataPayloadFixture` — payload batch de DADOS (5 blocos, cada um no shape correto).
- `baseManifests` — os 7 manifestos da base inicial (`kpi`, `bar_chart`, `line_chart`, `donut`, `table`, `title`, `rich_text`).

## Scripts

```bash
npm install
npm test        # ajv valida fixtures + casos negativos (node --test)
npm run build   # tsup → dist (ESM + CJS + .d.ts/.d.cts)
npm run typecheck
```

> Build **dual ESM+CJS**: consumível pelo backend (`tsconfig module: node16`,
> CJS) **e** pelo frontend (Vite/bundler, ESM) sem fricção de interop.

## Como BE e FE consomem

São projetos npm separados (sem workspaces). Adicione como dependência local —
**sem publicar em registry**:

```jsonc
// backend-boilerplate/package.json  e  frontend-boilerplate/package.json
{
  "dependencies": {
    "@dashboards/contracts": "file:../shared/contracts"
  }
}
```

Depois `npm install` (compila o `dist` via `prepare`/`build` conforme seu fluxo;
ou rode `npm run build` em `shared/contracts` antes). Uso:

```ts
import {
  validateDashboardLayout, assertValid, SOCKET_EVENTS, dashboardRoom,
  dashboardConfigFixture,            // fixtures para mocks
} from '@dashboards/contracts';
import type {
  DashboardConfig, BlockManifest, DashboardDataPayload, ServerToClientEvents,
} from '@dashboards/contracts';

// runtime validation (BE: valida config salva / payload do worker; FE: opcional)
const layout = assertValid(validateDashboardLayout, input, 'dashboard layout');
```

### Alternativa: alias de path para a fonte (dev, type-only)

Para iterar sem rebuild, aponte um alias para o source `.ts` (bundlers/tsx
resolvem direto). O pacote expõe `"./src"` no `exports`:

```jsonc
// tsconfig do consumidor
{ "compilerOptions": { "paths": { "@dashboards/contracts": ["../shared/contracts/src/index.ts"] } } }
```

> Para validação **runtime** com ajv, o consumidor precisa do `ajv` instalado
> (vem transitivamente pela dependência `file:` acima). Imports **type-only**
> não exigem runtime algum.

## Garantias (provadas no CI/local)

- Os JSON Schemas compilam no ajv sem erro.
- As fixtures validam contra os schemas; casos inválidos são rejeitados.
- `tsc` verde (tipos derivados) — provado importando sob `node16/CJS` (estilo BE)
  **e** `bundler/ESM` (estilo FE).

## Estender (ao adicionar um bloco novo ao catálogo — T-I/F0.4)

Os contratos aqui são genéricos (`Block.type` e `BlockManifest.type` são strings
abertas) — **não** precisam mudar para cada novo bloco. Acrescente apenas o
manifesto do bloco na sua pasta do catálogo (doc 33) e, se quiser, uma fixture.
