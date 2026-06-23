# 40 — Plano de execução (ordem, trilhas, pronto p/ virar tasks)

> Status: PROPOSTA v1. Consolida F1–F4 + contrato (20) + paralelização (21) numa
> ordem executável. Quando o usuário aprovar, isto vira **1 requisito + N tasks**.

## FASE 0 — Contratos (SEQUENCIAL, 1 agente) — pré-requisito de TUDO
> Sem isto, não se paraleliza. Define todas as fronteiras.
- **F0.1** Schema Prisma completo + migration (modelo `30`).
- **F0.2** `lib/crypto` (AES-256-GCM), `lib/env` (chaves novas), esqueleto `lib/pg-runner` + tipos.
- **F0.3** Contratos compartilhados (JSON Schema neutro): `DashboardLayout`, `BlockManifest`,
  `DataContract`, DTOs de API, eventos de socket.
- **F0.4** Interface `BlockDefinition` + registry (auto-registro via glob) + `BlockRenderer`
  (esqueleto FE) + `npx shadcn init` + setup Vitrine/Tailwind v4 + alias `@/`.
- **F0.5** Pontos de registro (plugins vazios) no `server.ts`; `QueryClientProvider` +
  `SocketProvider` no FE. (Evita disputa nesses arquivos depois.)

## FAN-OUT — trilhas paralelas (arquivos disjuntos)
| Trilha | Entregа | Dep |
|--------|---------|-----|
| **T-A** BE Conexões (CRUD, test, schema, query, pg-runner completo, cifragem) | F0 |
| **T-B** BE Dashboards/Charts/Share/Departments (CRUD + publish/unpublish + share TTL) | F0 |
| **T-C** BE Data (batch endpoint + cache Redis 2 níveis + fila BullMQ + socket emit) | F0, contrato bloco |
| **T-D** BE MCP server (tools sobre A/B/C) | T-A,B,C (interfaces) |
| **T-E** FE shell + data layer (router, providers, api-client, socket-client, query-keys) | F0 |
| **T-F** FE listagens (dashboards/charts) + conexões (reusa db-* Vitrine) | T-E |
| **T-G** FE dashboard render (FilterBar, grid, BlockRenderer) + editor enxuto + publish | T-E, contrato LAYOUT |
| **T-H** FE chat embutido (gráfico inline + add-to-dashboard) | T-E + **spec API externa (BLOQUEADO)** |
| **T-I** Catálogo: 1 bloco por agente (manifest+component) — Vitrine slugs | F0.4 |
| **T-J** Export PDF | T-G |

> T-I é o paralelismo mais fino: cada gráfico (bar, line, donut, kpi, sparkline, gauge,
> heatmap, table, + narrativos) é uma task isolada → N agentes simultâneos.
> FE (T-G/T-I) trabalha contra **fixtures** do `dataContract` até T-C ficar pronto.

## INTEGRAÇÃO (sequencial, ao final)
- Ligar data endpoint ↔ fila ↔ socket ↔ BlockRenderer (modo published com cache).
- Smoke e2e: criar conexão → criar chart (manual/MCP) → montar dashboard → publish →
  render com filtros → share-link (TTL) → export PDF.

## PRÉ-REQUISITOS antes de gerar as tasks
- [ ] **Confirmar matriz RBAC** (proposta em `01`).
- [ ] **Spec da API externa do agente** (só destrava T-H; o resto segue sem ela).
- [ ] Confirmar gaps: bloco markdown/title (lib leve de markdown), validação de dados no BE,
      `PDF` server-side vs client-side (módulo `10`, ainda aberto).
- [ ] Confirmar contrato `20` (você havia pulado essa confirmação).

## Como isso vira tasks (proposta)
- 1 **requisito** "Plataforma de dashboards por IA (MVP)".
- Fase 0 = 5 tasks sequenciais (com todos).
- Cada trilha T-A…T-J = 1+ tasks. T-I = 1 task por bloco do catálogo.
- Integração = 1 task final.

## Ajuste (rodada 6) — Catálogo aberto
- T-I entrega só a **BASE** (kpi, bar, line, donut, table, title, rich_text) + o
  **mecanismo de auto-registro** (`build:catalog`). Novos blocos entram depois, cada um
  como task isolada (processo contínuo), inclusive componentes próprios do usuário.

## Ajuste (rodada 7) — Chat
- **T-H** deixa de ser "bloqueado": entrega o **chat mockado** (experiência visual completa),
  posicionado como a **ÚLTIMA** task do fan-out.
- Nova task futura **T-H2 — Integração real do chat** (substitui o mock pela API externa),
  executada quando o usuário entregar a spec. Não bloqueia o MVP visual.

## ✅ Tasks geradas (rodada 7)
Requisito "Plataforma de dashboards/relatórios gerados por IA — MVP" criado com 22 tasks
vinculadas (Fase 0 ×5 → fan-out BE ×7 → fan-out FE/catálogo/PDF ×7 → INT → T-H mock → T-H2).
Todos detalhados nas tasks da Fase 0 e nas técnicas (T-A, T-C, T-G1, T-I).
