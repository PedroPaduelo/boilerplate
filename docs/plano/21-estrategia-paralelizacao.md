# 21 — Estratégia de paralelização (vários agentes sem colisão)

> Status: PROPOSTA v0. Requisito do usuário: soltar um agente para um pedaço e
> outro para outro, em paralelo, sem que se choquem.

## Princípio central

> **Contrato primeiro, implementação depois.** Enquanto os contratos compartilhados
> não estiverem fixados, NÃO se paraleliza. Depois de fixados, eles viram a fronteira
> e cada trilha trabalha em arquivos disjuntos.

## Fase 0 — Trabalho SEQUENCIAL (gargalo, faz primeiro, 1 agente)

Não dá pra paralelizar até existir:
1. **Schema Prisma** (F1) — todas as tabelas. É ponto de contenção (1 arquivo).
2. **Pacote de tipos/contratos compartilhados** — `DashboardConfig`, `BlockManifest`,
   `dataContract`, eventos de socket, DTOs de API (Zod/TS). Fonte da verdade única.
3. **Catálogo: o registry + a interface `BlockDefinition`** (a "forma" que todo bloco
   implementa) e o mecanismo de **auto-registro** (glob/index) para evitar que cada
   gráfico edite um index central.

Saída da Fase 0 = as fronteiras. A partir daqui, paraleliza.

## Trilhas paralelas (cada uma em arquivos próprios)

| Trilha | Escopo (arquivos disjuntos) | Depende de |
|--------|------------------------------|------------|
| T-A | **BE: Conexões** (CRUD, executar query, introspecção) | Schema + tipos |
| T-B | **BE: Dashboard/Config + Publish + Share-link** (CRUD config) | Schema + tipos |
| T-C | **BE: Execução de dados** (fila BullMQ + cache Redis + socket emit) | Schema + tipos + contrato bloco |
| T-D | **BE: MCP Server** (tools que consomem serviços A/B/C) | tipos + tools de A/B/C |
| T-E | **FE: App shell + data layer** (TanStack Query, socket client, rotas) | tipos/DTO |
| T-F | **FE: Telas de listagem** (dashboards/gráficos) | tipos/DTO + T-E |
| T-G | **FE: Tela de dashboard** (render por config, filtros, grid) | contrato LAYOUT + T-E |
| T-H | **FE: Chat/Agente** | tipos + T-E |
| T-I | **Biblioteca de componentes** (1 gráfico = 1 arquivo + auto-registro) | interface BlockDefinition |
| T-J | **PDF** | T-G |

## Regras anti-colisão

1. **Um arquivo, um dono por vez.** Trilhas não editam os mesmos arquivos.
2. **Index/registry central é proibido como ponto de edição compartilhado.** Usar
   **auto-registro por glob** (cada bloco se registra) ou import-map gerado.
   Ex.: cada gráfico exporta um `BlockDefinition` e um loader varre a pasta.
3. **Rotas Fastify**: cada módulo registra suas rotas via plugin próprio (1 arquivo
   por módulo) — `server.ts` só dá `register(plugin)`. Definir esses pontos de
   registro na Fase 0 para não disputar `server.ts`.
4. **Prisma schema**: todas as alterações de modelo concentradas na Fase 0. Trilhas
   não mexem em `schema.prisma` depois.
5. **Mocks pelo contrato**: enquanto o BE de dados (T-C) não está pronto, o FE (T-G/T-I)
   trabalha contra **fixtures** que seguem o `dataContract` — desacopla totalmente.

## A biblioteca de componentes (T-I) — o paralelismo mais fino

Cada componente/gráfico que o usuário já tem na biblioteca dele vira:
- **1 arquivo** (`catalog/charts/<tipo>/index.tsx`) implementando `BlockDefinition`:
  `{ type, name, propsSchema, dataContract, Component }`.
- **Auto-registrado** (sem tocar em index central).
- Acompanha **fixture** + story/preview + manifesto para o MCP.

→ Resultado: N agentes inserindo N gráficos **simultaneamente**, cada um isolado.
Esse é o ganho que o usuário pediu para "a parte mais chata".

## Como executar (ferramental disponível)

- Subagentes deste ambiente podem ser criados em **branch própria** (worktree
  isolada, merge de volta) — ideal para trilhas BE/FE pesadas.
- Ou compartilhando worktree quando os escopos de arquivo são garantidamente disjuntos.
- A ordem: Fase 0 (1 agente) → fan-out nas trilhas → integração.

## Decisões em aberto
- [ ] Confirmar mecanismo de auto-registro do catálogo (glob vs codegen).
- [ ] Definir os plugins/pontos de registro de rotas na Fase 0.
- [ ] Monorepo: criar um pacote `shared/contracts` ou duplicar tipos em FE/BE?
      (lembrar do conflito Zod v3 BE × v4 FE).
