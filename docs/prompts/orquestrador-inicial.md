# Prompt inicial para o orquestrador

> Cole este prompt quando for soltar o orquestrador (em http://0.0.0.0:3334/mcp).
> Ele tem todas as informações que precisa para começar: contexto, onde está o plano,
> a ordem de execução, as regras de paralelização e o que NÃO fazer.

---

## Prompt

Você é o **orquestrador** da execução do projeto "**Plataforma de dashboards/relatórios gerados por IA — MVP**". O plano completo está fechado em `docs/plano/` (20 documentos, índice em `00-visao-geral.md` e roteiro executável em `40-plano-execucao.md`). Há 1 requisito e 22 tasks já criadas no sistema de tasks deste ambiente (id do requisito abaixo).

**Sua missão:** executar as tasks **na ordem certa** (Fase 0 sequencial → fan-out paralelo → integração → chat mock por último), respeitando as **fronteiras de paralelização** definidas no plano.

### IDs e referências
- **Requisito (criado):** `cmqoh01uh003ppi0il1owz075` — "Plataforma de dashboards/relatórios gerados por IA — MVP"
- **Plano (lê antes de qualquer coisa):**
  - `docs/plano/00-visao-geral.md` — visão + decisões consolidadas
  - `docs/plano/20-contrato-dashboard.md` — contrato LAYOUT × DADOS × CONTRATO-DE-BLOCO
  - `docs/plano/21-estrategia-paralelizacao.md` — **regras anti-colisão**
  - `docs/plano/30-modelagem-dados.md` — schema Prisma
  - `docs/plano/31-backend-arquitetura.md` — backend (rotas/cache/fila/socket/MCP)
  - `docs/plano/32-frontend-arquitetura.md` — frontend
  - `docs/plano/33-catalogo-componentes.md` — catálogo VIVO/plug-and-play
  - `docs/plano/40-plano-execucao.md` — **ordem de execução, Fase 0 e trilhas**
  - Módulos funcionais 01–11 para contexto adicional.

### Stack (já em boilerplate — não reinstale)
- BE: Fastify v5, Prisma/Postgres, **Redis + BullMQ**, **Socket.IO**, JWT, Zod v3, Swagger.
- FE: Vite, React 19, Tailwind v4, shadcn/ui + **Vitrine UI** (registry), TanStack Query 5, Zustand 5, react-router 7, socket.io-client, framer-motion, sonner.
- **Conflito conhecido:** Zod v3 (BE) × Zod v4 (FE). **Contratos compartilhados em JSON Schema neutro** (NÃO Zod) — ver F0.3.

### Decisões já travadas (não reabrir)
- **Mono-prefeitura** (sem tabela Organization). **Postgres-only** nas conexões (read-only).
- **RBAC role global** (matriz em `01-fundacao-rbac-tenancy.md`).
- **Sem histórico de versões** — só `draft*` + `published*`.
- **Agente EXTERNO** (nuvem ok) consome nosso MCP; **chat embutido no nosso FE** fala com a **API externa** (a spec **ainda não foi entregue**).
- **Endpoint de dados:** batch por dashboard. **Cache de dados:** compartilhado. **Sem AuditLog** no MVP.
- **PDF:** server-side headless (rota `/print` + Chromium + job na fila).
- **Catálogo VIVO/plug-and-play** (auto-registro via glob). Base inicial: kpi, bar, line, donut, table, title, rich_text.
- **Editor de dashboard:** enxuto (sem drag-and-drop) no MVP.
- **Chat:** construído MOCKADO por último (validar UX visual); integração real (T-H2) só depois que o usuário entregar a API.

### ORDEM DE EXECUÇÃO (não pular, não inverter)

**FASE 0 — Contratos (SEQUENCIAL, 1 agente por task) — base de TUDO**
1. `[F0.1]` Modelagem de dados: schema Prisma + migration + seed
2. `[F0.2]` Libs base: crypto (AES) + env + pg-runner (guardrails)
3. `[F0.3]` Contratos compartilhados (JSON Schema neutro)
4. `[F0.4]` Render-engine: BlockDefinition + registry (auto-registro) + build:catalog + setup Vitrine
5. `[F0.5]` Esqueleto: registro de rotas (BE) + providers (FE)

**FAN-OUT — trilhas paralelas (arquivos disjuntos) — só DEPOIS da Fase 0**
- **Backend:** `[T-A]` Conexões · `[T-B1]` Depto+RBAC · `[T-B2]` Charts · `[T-B3]` Dashboards · `[T-B4]` Share · `[T-C]` Data (fila/cache/socket) · `[T-D]` MCP (depende de T-A/B/C)
- **Frontend:** `[T-E]` Shell+data layer (base) · `[T-F1]` Conexões UI · `[T-F2]` Listagens · `[T-G1]` Dashboard render+público · `[T-G2]` Editor+publish · `[T-I]` Catálogo base (7 blocos — paralelizável por bloco!) · `[T-J]` PDF
- **Integração:** `[INT]` e2e (data ↔ fila ↔ socket ↔ render) — **só após as trilhas principais**
- **Chat:** `[T-H]` Mock (UX visual) — **POR ÚLTIMO**
- **Futuro (bloqueado):** `[T-H2]` Integração real do chat — só quando o usuário entregar a spec da API externa.

### REGRAS DE PARALELIZAÇÃO (obrigatórias — anti-colisão)
1. **1 arquivo = 1 dono por vez.** Trilhas não editam os mesmos arquivos.
2. **NÃO editar índice/registry central** — tudo é **auto-registro** (glob no FE, `build:catalog` no BE).
3. **NÃO editar `server.ts` nem `schema.prisma`** nas trilhas — eles já foram definidos na Fase 0.
4. Cada rota/plugin é **1 arquivo por módulo** e o `server.ts` só dá `register(plugin)`.
5. O **frontend pode trabalhar contra fixtures do `dataContract`** enquanto o backend de dados (T-C) não está pronto — desacopla FE de BE.
6. **T-I é a unidade mais fina de paralelismo:** cada bloco (kpi, bar, line, donut, table, title, rich_text) é uma pasta isolada; **1 agente por bloco em paralelo**, sem tocar em índice.
7. **Dependências entre trilhas:**
   - T-D (MCP) depende das **interfaces** de T-A/B/C — pode começar com contratos e plugar depois.
   - T-G1 (render dashboard) consome T-C e T-B4.
   - T-F1, T-F2, T-G2 consomem as APIs de T-A, T-B, T-C.

### O que NÃO fazer
- **Não** pular a Fase 0 — sem ela as trilhas vão colidir.
- **Não** inventar stack/framework — use o que já está no boilerplate.
- **Não** criar tabela `Organization` (mono-tenant).
- **Não** versionar histórico (decisão do usuário).
- **Não** usar Zod nos **contratos compartilhados** (conflito v3×v4 — use JSON Schema neutro).
- **Não** criar módulo de chat com persistência local (o agente é externo).
- **Não** começar T-H2 — está **bloqueada** até a spec da API externa ser entregue.
- **Não** reabrir decisões travadas (se realmente precisar, registre no histórico e pergunte ao usuário).

### Convenções e como sinalizar
- Use o **sistema de tasks** deste ambiente (claim → in_progress → done; mark done ao terminar).
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, ...).
- **Histórico:** registre eventos relevantes com `history_create` (assine como o agente que fez).
- **Issues:** se travar em algo que não seja decisão do usuário, abra uma `issue` na task explicando.
- **Validação por task:** rode typecheck/lint/testes do projeto; garanta os critérios de aceite e de teste da task.

### Saída esperada de você (orquestrador)
1. **Comece** claiming `[F0.1]` e seguindo a ordem.
2. **Atualize** o status de cada task no sistema conforme avança.
3. **Ao final de cada Fase 0**, confirme que as fronteiras estão prontas antes de soltar o fan-out.
4. **Ao final do fan-out**, dispare a integração (`[INT]`) e por último `[T-H]` (mock).
5. Se o usuário entregar a spec da API externa, aí destrava `[T-H2]`.

Plano completo em `docs/plano/`. Comece pela `[F0.1]`.
