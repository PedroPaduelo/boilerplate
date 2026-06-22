# Módulo `export` (T-J) — Export PDF server-side headless

> Gera o PDF de um dashboard **fiel à tela** abrindo a rota de impressão do FE
> com um **headless Chromium (Playwright)** e chamando `page.pdf()`.
> Fontes: `docs/plano/10-export-pdf.md` (decisão travada) e
> `docs/plano/31-backend-arquitetura.md` (fila/worker/integração).

## Superfície

```
POST /export/dashboards/:id/pdf   (auth, artifacts:export)
  body: { mode?: 'published'|'draft' = 'published', filters?: {}, async?: boolean = true }
  - async=true  → 202 { jobId, status:'queued', statusUrl, downloadUrl }  (fila BullMQ)
  - async=false → 200 application/pdf (stream)                            (síncrono)

GET  /export/jobs/:jobId           (auth, artifacts:export, dono/ADMIN)
  → 200 { jobId, state, dashboardId, bytes?, message?, requestedAt, updatedAt, downloadUrl? }

GET  /export/jobs/:jobId/pdf       (auth, artifacts:export, dono/ADMIN)
  → 200 application/pdf  |  404 se ainda não pronto / expirado
```

## Pipeline (como o headless autentica e gera o PDF)

```
POST /export/dashboards/:id/pdf
  └─ loadDashboardForExport(id, mode, ctx)      ← visibilidade + título (cabeçalho)
  └─ assina TOKEN DE SERVIÇO curto (token.ts)   ← JWT HS256 (mesmo JWT_SECRET), TTL 300s
  └─ buildPrintUrl(...)                          ← <FE>/print/dashboards/:id?token=..&mode=..&filters=..
  └─ playwrightRenderer.render(...)              ← chromium headless:
        goto(url, networkidle)                   ← FE usa o token como Bearer (cliente dedicado)
        waitForSelector('[data-print-ready="true"]')  ← FE sinaliza fim da hidratação
        page.pdf({ header/footer, A4, printBackground })  ← título+marca / data+paginação
```

- **Token de serviço** (`token.ts`): JWT curto assinado com o **mesmo `JWT_SECRET`**
  da app, então o `request.jwtVerify()` do `@fastify/jwt` o aceita nas rotas
  autenticadas que o FE chama (`GET /dashboards/:id`, `POST /dashboards/:id/data`).
  Carrega `sub`+`role` do solicitante → **RBAC/visibilidade respeitados** (o PDF vê
  só o que o usuário veria). Expira em `EXPORT_TOKEN_TTL_SECONDS` (default 300s).
  **Nunca** expõe credenciais longas; é assinado no worker (TTL fresco ao renderizar).
- **Rota /print do FE** (`frontend-boilerplate/src/features/print`): layout LIMPO
  (sem sidebar/topbar/ações), modo published, filtros via query string. Marca
  `[data-print-ready="true"]` quando a hidratação termina (sucesso OU dados
  indisponíveis — um relatório sempre é produzido quando o dashboard é visível).

## Fila `export-pdf` + worker (padrão T-C)

- `jobs/queue.ts` — fila **própria** do módulo (reusa `connectionRedisConfigQueue`),
  `jobId` = id do export. Sem editar o registro central de filas.
- `jobs/worker.ts` — `Worker('export-pdf', ...)` no **mesmo processo da API**,
  iniciado por hook **`onReady`** no `index.ts` (depois do Redis subir em
  `server.ts`) — **sem tocar `server.ts`**. Concorrência 2 (Chromium é pesado).
  No-op em modo degradado (sem Redis) → a rota cai no caminho **síncrono**.
- `worker-handler.ts` — núcleo PURO (infra injetada): `running → renderPdf →
  storePdf → done → notify(export:ready)`; em falha `error → notify(export:failed)
  → relança` (BullMQ faz retry).
- `storage.ts` — resultado em Redis (`export:status:{jobId}` + `export:pdf:{jobId}`
  base64) com TTL `EXPORT_RESULT_TTL_SECONDS` (default 600s), para download
  cross-process. Notificação ao usuário via `socketManager.sendToUser` (eventos
  `export:ready` / `export:failed`).

## Cabeçalho / rodapé / paginação

`pdf-service.ts` monta `headerTemplate` (título + marca) e `footerTemplate`
(`Gerado em <data>` + `Página X de Y` via as classes `pageNumber`/`totalPages` do
Chromium), com `displayHeaderFooter:true`, `printBackground:true`, A4 e margens.

## Envs (config.ts — lidas direto de `process.env`, defaults seguros)

| Env | Default | O quê |
|-----|---------|-------|
| `EXPORT_PRINT_BASE_URL` | `http://localhost:5173` | base URL do FE (rota /print) |
| `EXPORT_BRAND` | `Prefeitura` | marca no cabeçalho |
| `EXPORT_TOKEN_TTL_SECONDS` | `300` | TTL do token de serviço |
| `EXPORT_NAV_TIMEOUT_MS` | `30000` | timeout de navegação |
| `EXPORT_READY_TIMEOUT_MS` | `30000` | timeout aguardando `[data-print-ready]` |
| `EXPORT_RESULT_TTL_SECONDS` | `600` | TTL do PDF/status no Redis |

## Requisito de ambiente (Chromium)

A geração **real** exige o binário do Chromium do Playwright + libs de sistema:

```
npx playwright install chromium          # baixa o browser
npx playwright install-deps chromium     # libs de SO (ou apt: libnss3, libglib2.0-0, libgbm1, ...)
```

No **sandbox de desenvolvimento o Chromium roda OK** (smoke validado: PDF de 67 KB
gerado pelos caminhos sync e fila). Em ambientes onde o browser não esteja
disponível, `render()` lança e o job/rota retornam erro — a fila, a rota e o token
**continuam funcionais e testáveis** (renderer mockado; ver `tests/export.test.ts`,
suite gated `EXPORT_E2E_CHROMIUM=1` para o Chromium real). O bundle de testes
default NÃO exige Chromium.

## Arquivos

```
index.ts             plugin (auth + rotas; onReady → ensureExportWorker)
routes/export-routes.ts  POST /export/dashboards/:id/pdf + GET status/pdf
service.ts           loadDashboardForExport + renderDashboardPdf (puro) + deps reais
pdf-service.ts       playwrightRenderer + templates header/footer (dynamic import)
token.ts             signServiceToken / verifyServiceToken (JWT curto HS256)
storage.ts           resultado/estado em Redis (base64) — cross-process
worker-handler.ts    processExportJob (puro, infra injetada)
config.ts            envs + buildPrintUrl
jobs/queue.ts        fila BullMQ export-pdf
jobs/worker.ts       worker (deps reais) + ensure/close
types.ts             ExportJobData / ExportStatus / ExportMode
```

## Fora do escopo (doc 10)

- Template avançado de marca (logo/cores customizáveis) — ajuste posterior.
